/**
 * @file        artifacts/api-server/src/lib/rag/pipeline.ts
 * @module      RAG / Pipeline
 * @purpose     Main RAG pipeline orchestrating chunking, embedding, indexing, and search
 *
 * @ai_instructions
 *   - Orchestrate the complete RAG pipeline from text to searchable embeddings
 *   - Provide high-level API for common RAG operations
 *   - Include error handling and logging throughout the pipeline
 *   - Support both synchronous and asynchronous processing modes
 *
 * @exports     RAGPipeline class and convenience functions
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { chunkText, TextChunk } from './chunker';
import { createEmbedder, EmbeddingResult } from './embedder';
import { createIndexer, IndexingOptions, IndexingResult } from './indexer';
import { createSearcher, SearchOptions, HybridSearchResult } from './searcher';
import { logger } from '../logger';

export interface PipelineOptions {
  chunking?: {
    maxChunkSize?: number;
    overlapSize?: number;
    minChunkSize?: number;
  };
  embedding?: {
    model?: string;
    dimensions?: number;
    batchSize?: number;
  };
  search?: {
    topK?: number;
    similarityThreshold?: number;
    rrfK?: number;
  };
}

export interface IndexPipelineResult extends IndexingResult {
  chunks: TextChunk[];
  embeddings: EmbeddingResult[];
  processingTime: number;
}

/**
 * Main RAG Pipeline class that orchestrates all components
 */
export class RAGPipeline {
  private embedder = createEmbedder();
  private indexer = createIndexer();
  private searcher = createSearcher();

  constructor(private options: PipelineOptions = {}) {}

  /**
   * Process text through the complete RAG pipeline
   * Takes raw text, chunks it, generates embeddings, and indexes them
   */
  async processAndIndex(
    text: string,
    indexingOptions: IndexingOptions
  ): Promise<IndexPipelineResult> {
    const startTime = Date.now();

    logger.info({ 
      textLength: text.length,
      entityType: indexingOptions.entityType,
      entityId: indexingOptions.entityId
    }, 'Starting RAG pipeline processing');

    try {
      // Step 1: Chunk the text
      const chunks = this.chunkText(text);
      logger.debug({ chunkCount: chunks.length }, 'Text chunked');

      // Step 2: Generate embeddings
      const embeddings = await this.generateEmbeddings(chunks);
      logger.debug({ embeddingCount: embeddings.length }, 'Embeddings generated');

      // Step 3: Index chunks and embeddings
      const indexingResult = await this.indexChunks(chunks, embeddings, indexingOptions);

      const processingTime = Date.now() - startTime;

      logger.info({
        processingTime,
        indexedCount: indexingResult.indexedCount,
        skippedCount: indexingResult.skippedCount,
        entityType: indexingOptions.entityType,
        entityId: indexingOptions.entityId
      }, 'RAG pipeline completed');

      return {
        ...indexingResult,
        chunks,
        embeddings,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        entityType: indexingOptions.entityType,
        entityId: indexingOptions.entityId
      }, 'RAG pipeline failed');
      throw error;
    }
  }

  /**
   * Search for relevant chunks using hybrid search
   */
  async search(query: string, options: SearchOptions = {}): Promise<HybridSearchResult> {
    const searchOptions = {
      ...this.options.search,
      ...options
    };

    return await this.searcher.search(query, searchOptions);
  }

  /**
   * Process multiple texts in batch
   */
  async processBatch(
    texts: string[],
    indexingOptions: IndexingOptions[]
  ): Promise<IndexPipelineResult[]> {
    if (texts.length !== indexingOptions.length) {
      throw new Error('Texts and indexingOptions arrays must have the same length');
    }

    logger.info({ batchSize: texts.length }, 'Starting batch RAG processing');

    const results: IndexPipelineResult[] = [];

    // Process in parallel with concurrency control
    const concurrencyLimit = 5;
    for (let i = 0; i < texts.length; i += concurrencyLimit) {
      const batch = texts.slice(i, i + concurrencyLimit);
      const optionsBatch = indexingOptions.slice(i, i + concurrencyLimit);

      const batchPromises = batch.map((text, index) =>
        this.processAndIndex(text, optionsBatch[index])
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error({
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
            batchIndex: i + index
          }, 'Batch item failed');
        }
      });
    }

    logger.info({
      totalItems: texts.length,
      successfulItems: results.length,
      failedItems: texts.length - results.length
    }, 'Batch RAG processing completed');

    return results;
  }

  /**
   * Re-index content (remove existing and re-process)
   */
  async reindex(
    text: string,
    indexingOptions: IndexingOptions
  ): Promise<IndexPipelineResult> {
    logger.info({
      entityType: indexingOptions.entityType,
      entityId: indexingOptions.entityId
    }, 'Starting re-indexing');

    // Remove existing chunks
    await this.indexer.removeChunks(indexingOptions.entityType, indexingOptions.entityId);

    // Process and index new content
    return await this.processAndIndex(text, indexingOptions);
  }

  /**
   * Get indexing statistics
   */
  async getIndexingStats(entityType: string, entityId: string) {
    return await this.indexer.getIndexingStats(entityType, entityId);
  }

  /**
   * Chunk text using configured options
   */
  private chunkText(text: string): TextChunk[] {
    const chunkingOptions = this.options.chunking || {};
    return chunkText(text, chunkingOptions);
  }

  /**
   * Generate embeddings for chunks
   */
  private async generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddingResult[]> {
    const texts = chunks.map(chunk => chunk.text);
    return await this.embedder.embedChunks(texts);
  }

  /**
   * Index chunks and embeddings
   */
  private async indexChunks(
    chunks: TextChunk[],
    embeddings: EmbeddingResult[],
    options: IndexingOptions
  ): Promise<IndexingResult> {
    return await this.indexer.indexChunks(chunks, embeddings, options);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.embedder.clearCache();
    logger.info('RAG pipeline caches cleared');
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats() {
    return {
      embedder: this.embedder.getCacheStats(),
      options: this.options
    };
  }
}

/**
 * Create a new RAG pipeline instance
 */
export function createRAGPipeline(options: PipelineOptions = {}): RAGPipeline {
  return new RAGPipeline(options);
}

/**
 * Convenience function for processing and indexing text
 */
export async function processAndIndex(
  text: string,
  indexingOptions: IndexingOptions,
  pipelineOptions: PipelineOptions = {}
): Promise<IndexPipelineResult> {
  const pipeline = createRAGPipeline(pipelineOptions);
  return await pipeline.processAndIndex(text, indexingOptions);
}

/**
 * Convenience function for searching
 */
export async function searchRAG(
  query: string,
  searchOptions: SearchOptions = {},
  pipelineOptions: PipelineOptions = {}
): Promise<HybridSearchResult> {
  const pipeline = createRAGPipeline(pipelineOptions);
  return await pipeline.search(query, searchOptions);
}
