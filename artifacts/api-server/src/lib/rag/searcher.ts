/**
 * @file        artifacts/api-server/src/lib/rag/searcher.ts
 * @module      RAG / Hybrid Search
 * @purpose     Hybrid search combining vector similarity and BM25 keyword matching
 *
 * @ai_instructions
 *   - Implement pgvector cosine similarity search
 *   - Implement PostgreSQL full-text search with ts_rank
 *   - Combine results using Reciprocal Rank Fusion (RRF)
 *   - Support similarity threshold filtering
 *   - Return parent document context for child chunks
 *
 * @exports     search function and Searcher class
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from '@workspace/db';
import { embeddingChunksTable } from '@workspace/db/schema';
import { eq, and, or, cosineDistance, sql } from 'drizzle-orm';
import { logger } from '../logger';
import { isEnabled, FEATURE_FLAGS, type FeatureFlagContext } from '../feature-flags';
import { createEmbedder } from './embedder';

export interface SearchOptions {
  topK?: number;
  similarityThreshold?: number;
  rrfK?: number; // RRF parameter
  includeMetadata?: boolean;
  filters?: {
    threadId?: string;
    entityType?: string;
    dateRange?: { start: Date; end: Date };
  };
}

export interface SearchResult {
  chunkId: string;
  text: string;
  score: number;
  vectorScore?: number;
  keywordScore?: number;
  metadata?: Record<string, any>;
  source: 'vector' | 'keyword' | 'hybrid';
}

export interface HybridSearchResult {
  results: SearchResult[];
  query: string;
  searchTime: number;
  totalResults: number;
  vectorResultsCount: number;
  keywordResultsCount: number;
}

/**
 * Hybrid search combining vector similarity and BM25 keyword matching
 */
export class Searcher {
  private embedder = createEmbedder();

  /**
   * Perform hybrid search using both vector similarity and keyword matching
   */
  async search(query: string, options: SearchOptions = {}): Promise<HybridSearchResult> {
    // Check if RAG hybrid search is enabled
    const context: FeatureFlagContext = {
      // Note: tenantId and userId should be passed in options for proper context
      // For now, we'll check the flag without specific context
    };
    
    const hybridSearchEnabled = await isEnabled(FEATURE_FLAGS.RAG_HYBRID_SEARCH, context);
    if (!hybridSearchEnabled) {
      throw new Error('RAG hybrid search is currently disabled');
    }

    const startTime = Date.now();
    const opts = {
      topK: 10,
      similarityThreshold: 0.7,
      rrfK: 60,
      includeMetadata: true,
      ...options
    };

    logger.info({ 
      query: query.substring(0, 100), 
      topK: opts.topK,
      similarityThreshold: opts.similarityThreshold
    }, 'Starting hybrid search');

    try {
      // Perform parallel searches
      const [vectorResults, keywordResults] = await Promise.all([
        this.vectorSearch(query, opts),
        this.keywordSearch(query, opts)
      ]);

      // Combine results using Reciprocal Rank Fusion
      const hybridResults = this.reciprocalRankFusion(
        vectorResults,
        keywordResults,
        opts.rrfK
      );

      // Apply similarity threshold and return top-K
      const finalResults = hybridResults
        .filter(result => result.score >= opts.similarityThreshold!)
        .slice(0, opts.topK!);

      const searchTime = Date.now() - startTime;

      logger.info({
        query: query.substring(0, 100),
        searchTime,
        totalResults: finalResults.length,
        vectorResultsCount: vectorResults.length,
        keywordResultsCount: keywordResults.length
      }, 'Hybrid search completed');

      return {
        results: finalResults,
        query,
        searchTime,
        totalResults: finalResults.length,
        vectorResultsCount: vectorResults.length,
        keywordResultsCount: keywordResults.length
      };

    } catch (error) {
      const searchTime = Date.now() - startTime;
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 100),
        searchTime
      }, 'Hybrid search failed');
      throw error;
    }
  }

  /**
   * Vector similarity search using pgvector
   */
  private async vectorSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      // Generate query embedding
      const embeddingResult = await this.embedder.embedChunk(query);
      const queryEmbedding = embeddingResult.embedding;

      // Build the vector similarity query
      const vectorQuery = db
        .select({
          id: embeddingChunksTable.id,
          text: embeddingChunksTable.chunkText,
          metadata: embeddingChunksTable.metadata,
          similarity: sql<number>`1 - ${cosineDistance(embeddingChunksTable.embedding, queryEmbedding)}`
        })
        .from(embeddingChunksTable)
        .where(
          and(
            // Apply filters if provided
            options.filters?.threadId 
              ? eq(embeddingChunksTable.threadId, options.filters.threadId)
              : undefined,
            // Add other filters as needed
          )
        )
        .orderBy(sql`${embeddingChunksTable.embedding} <=> ${queryEmbedding}`)
        .limit(options.topK! * 2); // Get more results for better fusion

      const results = await vectorQuery;

      return results.map(row => ({
        chunkId: row.id,
        text: row.text,
        score: row.similarity,
        vectorScore: row.similarity,
        metadata: options.includeMetadata ? (row.metadata as Record<string, any>) : undefined,
        source: 'vector' as const
      }));

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 100)
      }, 'Vector search failed');
      return [];
    }
  }

  /**
   * Keyword search using PostgreSQL full-text search (BM25)
   */
  private async keywordSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      // Build the full-text search query
      const tsQuery = sql`plainto_tsquery('english', ${query})`;
      
      const keywordQuery = db
        .select({
          id: embeddingChunksTable.id,
          text: embeddingChunksTable.chunkText,
          metadata: embeddingChunksTable.metadata,
          rank: sql<number>`ts_rank(to_tsvector('english', ${embeddingChunksTable.chunkText}), ${tsQuery})`
        })
        .from(embeddingChunksTable)
        .where(
          and(
            sql`${tsQuery} @@ to_tsvector('english', ${embeddingChunksTable.chunkText})`,
            // Apply filters if provided
            options.filters?.threadId 
              ? eq(embeddingChunksTable.threadId, options.filters.threadId)
              : undefined
          )
        )
        .orderBy(sql`${embeddingChunksTable.chunkText} <=> ${tsQuery}`)
        .limit(options.topK! * 2); // Get more results for better fusion

      const results = await keywordQuery;

      return results.map(row => ({
        chunkId: row.id,
        text: row.text,
        score: row.rank,
        keywordScore: row.rank,
        metadata: options.includeMetadata ? (row.metadata as Record<string, any>) : undefined,
        source: 'keyword' as const
      }));

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 100)
      }, 'Keyword search failed');
      return [];
    }
  }

  /**
   * Combine vector and keyword results using Reciprocal Rank Fusion (RRF)
   */
  private reciprocalRankFusion(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[],
    k: number = 60
  ): SearchResult[] {
    const scoreMap = new Map<string, SearchResult>();

    // Process vector results
    vectorResults.forEach((result, index) => {
      const rrfScore = 1.0 / (k + index + 1);
      const existing = scoreMap.get(result.chunkId);
      
      if (existing) {
        existing.score += rrfScore;
        existing.vectorScore = result.vectorScore;
      } else {
        scoreMap.set(result.chunkId, {
          ...result,
          score: rrfScore,
          source: 'hybrid'
        });
      }
    });

    // Process keyword results
    keywordResults.forEach((result, index) => {
      const rrfScore = 1.0 / (k + index + 1);
      const existing = scoreMap.get(result.chunkId);
      
      if (existing) {
        existing.score += rrfScore;
        existing.keywordScore = result.keywordScore;
      } else {
        scoreMap.set(result.chunkId, {
          ...result,
          score: rrfScore,
          source: 'hybrid'
        });
      }
    });

    // Convert to array and sort by combined score
    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get parent document context for a chunk
   */
  async getParentContext(chunkId: string): Promise<string | null> {
    try {
      // This would retrieve the full parent document or message
      // For now, return the chunk text itself
      const chunk = await db
        .select({ text: embeddingChunksTable.chunkText })
        .from(embeddingChunksTable)
        .where(eq(embeddingChunksTable.id, chunkId))
        .limit(1);

      return chunk[0]?.text || null;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        chunkId
      }, 'Failed to get parent context');
      return null;
    }
  }
}

/**
 * Convenience function for hybrid search
 */
export async function search(query: string, options: SearchOptions = {}): Promise<HybridSearchResult> {
  const searcher = new Searcher();
  return await searcher.search(query, options);
}

/**
 * Create searcher instance
 */
export function createSearcher(): Searcher {
  return new Searcher();
}
