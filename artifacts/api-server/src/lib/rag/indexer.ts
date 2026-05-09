/**
 * @file        artifacts/api-server/src/lib/rag/indexer.ts
 * @module      RAG / Indexing
 * @purpose     Index text chunks and embeddings into database for RAG retrieval
 *
 * @ai_instructions
 *   - Insert chunks and embeddings into embedding_chunks table
 *   - Support parent-child chunk relationships for context retrieval
 *   - Include metadata for filtering and tracking
 *   - Handle batch inserts efficiently with proper error handling
 *
 * @exports     indexChunks function and Indexer class
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from '@workspace/db';
import { embeddingChunksTable } from '@workspace/db/schema';
import { eq, and, or, cosineDistance, sql } from 'drizzle-orm';
import { logger } from '../logger';
import { TextChunk } from './chunker';
import { EmbeddingResult } from './embedder';

export interface IndexingOptions {
  entityType: 'message' | 'document' | 'knowledge_article';
  entityId: string;
  threadId?: string;
  metadata?: Record<string, any>;
}

export interface IndexingResult {
  indexedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Index text chunks and embeddings into the database
 */
export class Indexer {
  /**
   * Index chunks with their embeddings
   */
  async indexChunks(
    chunks: TextChunk[],
    embeddings: EmbeddingResult[],
    options: IndexingOptions
  ): Promise<IndexingResult> {
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunks and embeddings arrays must have the same length');
    }

    const result: IndexingResult = {
      indexedCount: 0,
      skippedCount: 0,
      errors: []
    };

    logger.info({ 
      entityType: options.entityType, 
      entityId: options.entityId, 
      chunkCount: chunks.length 
    }, 'Starting chunk indexing');

    // Check for existing chunks to avoid duplicates
    const existingChunks = await this.getExistingChunks(options.entityType, options.entityId);
    const existingHashes = new Set(existingChunks.map(c => c.contentHash));

    const insertData: any[] = [];
    
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const embedding = embeddings[index];
      const contentHash = this.generateContentHash(chunk.text);

      // Skip if already indexed
      if (existingHashes.has(contentHash)) {
        result.skippedCount++;
        continue;
      }

      insertData.push({
        threadId: options.threadId || null,
        messageId: options.entityType === 'message' ? options.entityId : null,
        tenantId: 'current-tenant', // TODO: Get from context
        chunkText: chunk.text,
        embedding: embedding.embedding,
        chunkIndex: chunk.index,
        embeddingModel: embedding.model,
        metadata: {
          ...options.metadata,
          entityType: options.entityType,
          entityId: options.entityId,
          contentHash,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          sentenceCount: chunk.metadata?.sentenceCount,
          isStartOfParagraph: chunk.metadata?.isStartOfParagraph,
          isEndOfParagraph: chunk.metadata?.isEndOfParagraph,
          embeddingDimensions: embedding.dimensions,
          indexedAt: new Date().toISOString()
        }
      });
    }

    if (insertData.length === 0) {
      logger.info({ entityType: options.entityType, entityId: options.entityId }, 'No new chunks to index');
      return result;
    }

    try {
      // Batch insert chunks
      await db.insert(embeddingChunksTable)
        .values(insertData)
        .onConflictDoNothing({
          target: [embeddingChunksTable.tenantId, embeddingChunksTable.messageId, embeddingChunksTable.chunkIndex]
        });

      result.indexedCount = insertData.length;

      logger.info({ 
        indexedCount: result.indexedCount,
        skippedCount: result.skippedCount,
        entityType: options.entityType,
        entityId: options.entityId
      }, 'Successfully indexed chunks');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      
      logger.error({ 
        error: errorMessage,
        entityType: options.entityType,
        entityId: options.entityId,
        batchSize: insertData.length
      }, 'Failed to index chunks');
    }

    return result;
  }

  /**
   * Get existing chunks for an entity
   */
  private async getExistingChunks(entityType: string, entityId: string) {
    // This would need to be implemented based on the actual schema
    // For now, return empty array
    return [];
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(text: string): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(text.trim())
      .digest('hex');
  }

  /**
   * Remove indexed chunks for an entity (for re-indexing)
   */
  async removeChunks(entityType: string, entityId: string): Promise<number> {
    try {
      // This would need to be implemented based on the actual schema
      // For now, return 0
      logger.info({ entityType, entityId }, 'Removing chunks for entity');
      return 0;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId
      }, 'Failed to remove chunks');
      throw error;
    }
  }

  /**
   * Get indexing statistics for an entity
   */
  async getIndexingStats(entityType: string, entityId: string): Promise<{
    totalChunks: number;
    lastIndexed: Date | null;
    embeddingModel: string | null;
  }> {
    try {
      // This would need to be implemented based on the actual schema
      // For now, return default values
      return {
        totalChunks: 0,
        lastIndexed: null,
        embeddingModel: null
      };
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId
      }, 'Failed to get indexing stats');
      throw error;
    }
  }
}

/**
 * Convenience function for indexing chunks
 */
export async function indexChunks(
  chunks: TextChunk[],
  embeddings: EmbeddingResult[],
  options: IndexingOptions
): Promise<IndexingResult> {
  const indexer = new Indexer();
  return await indexer.indexChunks(chunks, embeddings, options);
}

/**
 * Create indexer instance with database connection
 */
export function createIndexer(): Indexer {
  return new Indexer();
}
