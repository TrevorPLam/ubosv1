/**
 * @file        artifacts/api-server/src/lib/rag/embedder.ts
 * @module      RAG / Embedding Generation
 * @purpose     Generate embeddings using OpenAI API with caching and validation
 *
 * @ai_instructions
 *   - Use OpenAI text-embedding-3-small model with explicit 1536 dimensions
 *   - Implement content hash caching to avoid re-embedding identical chunks
 *   - Add retry logic and error handling for API failures
 *   - Validate embedding dimensions before returning
 *
 * @exports     embedChunks function with caching support
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import OpenAI from 'openai';
import crypto from 'crypto';
import { logger } from '../logger';

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  batchSize?: number;
  maxRetries?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  contentHash: string;
  model: string;
  dimensions: number;
  tokenCount?: number;
}

const DEFAULT_OPTIONS: EmbeddingOptions = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100,
  maxRetries: 3,
};

/**
 * Generate embeddings for text chunks using OpenAI API
 * Implements content hash caching and batch processing
 */
export class Embedder {
  private openai: OpenAI;
  private options: EmbeddingOptions;
  private cache: Map<string, EmbeddingResult> = new Map();

  constructor(apiKey: string, options: Partial<EmbeddingOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    this.openai = new OpenAI({
      apiKey,
      maxRetries: this.options.maxRetries,
    });
  }

  /**
   * Generate embeddings for multiple text chunks with caching
   */
  async embedChunks(chunks: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    const uncachedChunks: { text: string; index: number }[] = [];

    // Check cache first
    for (let i = 0; i < chunks.length; i++) {
      const contentHash = this.generateContentHash(chunks[i]);
      const cached = this.cache.get(contentHash);
      
      if (cached) {
        logger.debug({ index: i, hash: contentHash }, 'Cache hit for chunk');
        results[i] = cached;
      } else {
        uncachedChunks.push({ text: chunks[i], index: i });
      }
    }

    // Process uncached chunks in batches
    for (let i = 0; i < uncachedChunks.length; i += this.options.batchSize!) {
      const batch = uncachedChunks.slice(i, i + this.options.batchSize);
      if (!batch || batch.length === 0) continue;
      const batchTexts = batch.map(item => item.text);
      
      try {
        const batchResults = await this.generateBatchEmbeddings(batchTexts);
        
        for (let j = 0; j < batch.length; j++) {
          const result = batchResults[j];
          const originalIndex = batch[j].index;
          
          // Validate embedding dimensions
          if (result.embedding.length !== this.options.dimensions) {
            throw new Error(`Embedding dimension mismatch: expected ${this.options.dimensions}, got ${result.embedding.length}`);
          }
          
          // Cache the result
          this.cache.set(result.contentHash, result);
          results[originalIndex] = result;
        }
      } catch (error) {
        logger.error({ 
          batchSize: batch.length, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to generate batch embeddings');
        throw error;
      }
    }

    return results;
  }

  /**
   * Generate embeddings for a single text chunk
   */
  async embedChunk(text: string): Promise<EmbeddingResult> {
    const results = await this.embedChunks([text]);
    return results[0];
  }

  /**
   * Generate embeddings for a batch of texts
   */
  private async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    logger.debug({ 
      count: texts.length, 
      model: this.options.model 
    }, 'Generating batch embeddings');

    const response = await this.openai.embeddings.create({
      model: this.options.model!,
      input: texts,
      dimensions: this.options.dimensions,
    });

    return response.data.map((item: any, index: number) => ({
      embedding: item.embedding,
      contentHash: this.generateContentHash(texts[index]),
      model: this.options.model!,
      dimensions: this.options.dimensions!,
      tokenCount: response.usage?.prompt_tokens,
    }));
  }

  /**
   * Generate content hash for caching
   */
  private generateContentHash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text.trim())
      .digest('hex');
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Embedding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }

  /**
   * Validate embedding format and dimensions
   */
  static validateEmbedding(embedding: number[], expectedDimensions: number): boolean {
    if (!Array.isArray(embedding)) {
      return false;
    }
    
    if (embedding.length !== expectedDimensions) {
      return false;
    }
    
    // Check if all values are numbers and within reasonable range
    return embedding.every(value => 
      typeof value === 'number' && 
      !isNaN(value) && 
      isFinite(value) &&
      value >= -1 && 
      value <= 1
    );
  }
}

/**
 * Create embedder instance from environment configuration
 */
export function createEmbedder(): Embedder {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for embedding generation');
  }

  const options: Partial<EmbeddingOptions> = {};
  
  // Allow override of model via environment
  if (process.env.OPENAI_EMBEDDING_MODEL) {
    options.model = process.env.OPENAI_EMBEDDING_MODEL;
  }
  
  if (process.env.OPENAI_EMBEDDING_DIMENSIONS) {
    options.dimensions = parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS, 10);
  }

  return new Embedder(apiKey, options);
}

/**
 * Convenience function for embedding chunks
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embedder = createEmbedder();
  const results = await embedder.embedChunks(chunks);
  return results.map(r => r.embedding);
}
