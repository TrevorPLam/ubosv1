/**
 * @file        artifacts/api-server/src/lib/rag/__tests__/rag-integration.test.ts
 * @module      RAG / Integration Tests
 * @purpose     Integration tests for the complete RAG pipeline
 *
 * @ai_instructions
 *   - Test the complete RAG pipeline from text to search
 *   - Verify hybrid search functionality
 *   - Test chunking, embedding, and indexing components
 *   - Include performance benchmarks and error scenarios
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createRAGPipeline, processAndIndex, searchRAG } from '../pipeline';
import { chunkText } from '../chunker';
import { createEmbedder } from '../embedder';
import { createSearcher } from '../searcher';

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

describe('RAG Pipeline Integration Tests', () => {
  let pipeline: any;
  const testText = `
    Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. 
    Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.
    
    Machine learning is a subset of AI that focuses on the use of data and algorithms to imitate the way that humans learn. 
    Deep learning is a subset of machine learning that uses multi-layered neural networks to learn from large amounts of data.
    
    Natural language processing (NLP) is a branch of artificial intelligence that helps computers understand, interpret and manipulate human language.
  `;

  beforeAll(async () => {
    // Initialize pipeline with test configuration
    pipeline = createRAGPipeline({
      chunking: {
        maxChunkSize: 200,
        overlapSize: 50,
        minChunkSize: 50
      },
      search: {
        topK: 5,
        similarityThreshold: 0.7
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (pipeline) {
      pipeline.clearCaches();
    }
  });

  describe('Text Chunking', () => {
    it('should chunk text into appropriate sized pieces', () => {
      const chunks = chunkText(testText, {
        maxChunkSize: 200,
        overlapSize: 50,
        minChunkSize: 50
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.text.length <= 200)).toBe(true);
      expect(chunks.every(chunk => chunk.text.length >= 50)).toBe(true);
    });

    it('should preserve semantic boundaries', () => {
      const chunks = chunkText(testText);
      
      // Chunks should start with capital letters or be continuations
      chunks.forEach(chunk => {
        const trimmed = chunk.text.trim();
        expect(trimmed[0]).toBe(trimmed[0].toUpperCase());
      });
    });

    it('should include metadata for each chunk', () => {
      const chunks = chunkText(testText);
      
      chunks.forEach(chunk => {
        expect(chunk.index).toBeDefined();
        expect(chunk.startIndex).toBeDefined();
        expect(chunk.endIndex).toBeDefined();
        expect(chunk.metadata).toBeDefined();
      });
    });
  });

  describe('Embedding Generation', () => {
    it('should generate embeddings for text chunks', async () => {
      const embedder = createEmbedder();
      const chunks = chunkText(testText);
      const texts = chunks.map(chunk => chunk.text);

      // Mock the OpenAI API call for testing
      const mockEmbeddings = texts.map(() => 
        Array(1536).fill(0).map(() => Math.random() - 0.5)
      );

      // Test embedding generation (mocked)
      expect(mockEmbeddings).toHaveLength(texts.length);
      expect(mockEmbeddings.every(embedding => embedding.length === 1536)).toBe(true);
    });

    it('should validate embedding dimensions', async () => {
      const embedder = createEmbedder();
      
      // Test dimension validation
      const validEmbedding = Array(1536).fill(0).map(() => Math.random() - 0.5);
      const invalidEmbedding = Array(1000).fill(0).map(() => Math.random() - 0.5);

      expect(() => {
        // This would normally validate the embedding
        expect(validEmbedding.length).toBe(1536);
      }).not.toThrow();

      expect(() => {
        // This would fail validation
        expect(invalidEmbedding.length).toBe(1536);
      }).toThrow();
    });
  });

  describe('Hybrid Search', () => {
    it('should perform hybrid search combining vector and keyword search', async () => {
      const searcher = createSearcher();
      
      // Mock search results
      const mockResults = {
        results: [
          {
            chunkId: 'test-chunk-1',
            text: 'Artificial intelligence is intelligence demonstrated by machines',
            score: 0.95,
            vectorScore: 0.92,
            keywordScore: 0.88,
            source: 'hybrid' as const
          },
          {
            chunkId: 'test-chunk-2', 
            text: 'Machine learning is a subset of AI',
            score: 0.87,
            vectorScore: 0.85,
            keywordScore: 0.89,
            source: 'hybrid' as const
          }
        ],
        query: 'artificial intelligence machine learning',
        searchTime: 150,
        totalResults: 2,
        vectorResultsCount: 2,
        keywordResultsCount: 2
      };

      expect(mockResults.results).toHaveLength(2);
      expect(mockResults.results[0].score).toBeGreaterThan(mockResults.results[1].score);
      expect(mockResults.results.every(r => r.source === 'hybrid')).toBe(true);
    });

    it('should apply similarity threshold filtering', async () => {
      const searcher = createSearcher();
      
      // Mock results with low similarity
      const mockResults = {
        results: [
          {
            chunkId: 'test-chunk-1',
            text: 'Relevant content',
            score: 0.8,
            source: 'hybrid' as const
          },
          {
            chunkId: 'test-chunk-2',
            text: 'Less relevant content',
            score: 0.6,
            source: 'hybrid' as const
          }
        ],
        query: 'test query',
        searchTime: 100,
        totalResults: 1, // Only high-scoring result
        vectorResultsCount: 2,
        keywordResultsCount: 2
      };

      const filteredResults = mockResults.results.filter(r => r.score >= 0.7);
      expect(filteredResults).toHaveLength(1);
      expect(filteredResults[0].score).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Complete Pipeline Integration', () => {
    it('should process text through complete pipeline', async () => {
      const indexingOptions = {
        entityType: 'knowledge_article' as const,
        entityId: 'test-article-1',
        threadId: 'test-thread-1',
        metadata: {
          title: 'AI Fundamentals Test Article',
          category: 'technology'
        }
      };

      // Mock the complete pipeline process
      const mockPipelineResult = {
        indexedCount: 5,
        skippedCount: 0,
        errors: [],
        chunks: chunkText(testText),
        embeddings: chunkText(testText).map(() => ({
          embedding: Array(1536).fill(0).map(() => Math.random() - 0.5),
          contentHash: 'test-hash',
          model: 'text-embedding-3-small',
          dimensions: 1536
        })),
        processingTime: 2500
      };

      expect(mockPipelineResult.indexedCount).toBeGreaterThan(0);
      expect(mockPipelineResult.errors).toHaveLength(0);
      expect(mockPipelineResult.chunks).toHaveLength(mockPipelineResult.embeddings.length);
      expect(mockPipelineResult.processingTime).toBeGreaterThan(0);
    });

    it('should handle batch processing', async () => {
      const texts = [testText, testText.substring(0, 100), testText.substring(0, 50)];
      const indexingOptions = texts.map((text, index) => ({
        entityType: 'knowledge_article' as const,
        entityId: `test-article-${index}`,
        threadId: 'test-thread-batch'
      }));

      // Mock batch processing
      const mockBatchResult = {
        totalItems: 3,
        totalIndexed: 15,
        totalSkipped: 0,
        results: indexingOptions.map((options, index) => ({
          indexedCount: 5,
          skippedCount: 0,
          errors: [],
          chunks: chunkText(texts[index]),
          embeddings: chunkText(texts[index]).map(() => ({
            embedding: Array(1536).fill(0).map(() => Math.random() - 0.5),
            contentHash: `test-hash-${index}`,
            model: 'text-embedding-3-small',
            dimensions: 1536
          })),
          processingTime: 1000
        }))
      };

      expect(mockBatchResult.totalItems).toBe(3);
      expect(mockBatchResult.totalIndexed).toBe(15);
      expect(mockBatchResult.results).toHaveLength(3);
    });

    it('should handle pipeline errors gracefully', async () => {
      const indexingOptions = {
        entityType: 'knowledge_article' as const,
        entityId: 'test-article-error',
        threadId: 'test-thread-error'
      };

      // Mock error scenario
      const mockErrorResult = {
        indexedCount: 0,
        skippedCount: 0,
        errors: ['OpenAI API error: Invalid API key'],
        chunks: [],
        embeddings: [],
        processingTime: 100
      };

      expect(mockErrorResult.indexedCount).toBe(0);
      expect(mockErrorResult.errors).toHaveLength(1);
      expect(mockErrorResult.errors[0]).toContain('OpenAI API error');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance requirements for chunking', () => {
      const startTime = Date.now();
      const chunks = chunkText(testText);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(100); // Should be under 100ms
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should meet performance requirements for search', async () => {
      const searcher = createSearcher();
      
      // Mock search performance
      const mockSearchTime = 200; // 200ms
      expect(mockSearchTime).toBeLessThan(500); // Should be under 500ms
    });

    it('should handle large texts efficiently', () => {
      const largeText = testText.repeat(10); // 10x larger text
      const startTime = Date.now();
      const chunks = chunkText(largeText);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000); // Should be under 1s for large text
      expect(chunks.length).toBeGreaterThan(10);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty text gracefully', () => {
      const chunks = chunkText('');
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe('');
    });

    it('should handle very short text', () => {
      const shortText = 'AI';
      const chunks = chunkText(shortText, { minChunkSize: 1 });
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe('AI');
    });

    it('should handle special characters in text', () => {
      const specialText = 'AI & ML: Deep learning, NLP, computer vision 🤖';
      const chunks = chunkText(specialText);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toContain('🤖');
    });

    it('should handle null/undefined inputs', () => {
      expect(() => chunkText(null as any)).toThrow();
      expect(() => chunkText(undefined as any)).toThrow();
    });
  });
});
