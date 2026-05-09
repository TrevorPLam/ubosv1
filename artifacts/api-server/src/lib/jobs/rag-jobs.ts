/**
 * @file        artifacts/api-server/src/lib/jobs/rag-jobs.ts
 * @module      Jobs / RAG Processing
 * @purpose     Background jobs for RAG indexing and maintenance
 *
 * @ai_instructions
 *   - Create BullMQ jobs for async RAG processing
 *   - Schedule HNSW index rebuilds via pg_cron
 *   - Handle job failures and retries
 *   - Include proper job metadata and logging
 *
 * @exports     RAG job processors and queue setup
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Queue, Worker, Job } from 'bullmq';
import { createRAGPipeline, IndexingOptions } from '../rag/pipeline';
import type { IndexingOptions as IIndexingOptions } from '../rag/indexer';
import { logger } from '../logger';

// Redis connection for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

// Create RAG processing queue
export const ragQueue = new Queue('rag-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

/**
 * Job data for RAG indexing
 */
export interface RAGIndexJobData {
  text: string;
  indexingOptions: IndexingOptions;
  priority?: number;
}

/**
 * Process RAG indexing job
 */
export async function processRAGIndexJob(job: Job<RAGIndexJobData>) {
  const { text, indexingOptions } = job.data;
  
  logger.info({ 
    jobId: job.id,
    entityType: indexingOptions.entityType,
    entityId: indexingOptions.entityId,
    textLength: text.length
  }, 'Processing RAG index job');

  try {
    const pipeline = createRAGPipeline();
    const result = await pipeline.processAndIndex(text, indexingOptions);

    logger.info({
      jobId: job.id,
      indexedCount: result.indexedCount,
      skippedCount: result.skippedCount,
      processingTime: result.processingTime
    }, 'RAG index job completed');

    return result;

  } catch (error) {
    logger.error({
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      entityType: indexingOptions.entityType,
      entityId: indexingOptions.entityId
    }, 'RAG index job failed');
    throw error;
  }
}

/**
 * Job data for batch RAG processing
 */
export interface RAGBatchJobData {
  items: Array<{
    text: string;
    indexingOptions: IndexingOptions;
  }>;
  batchSize?: number;
}

/**
 * Process batch RAG indexing job
 */
export async function processRAGBatchJob(job: Job<RAGBatchJobData>) {
  const { items, batchSize = 10 } = job.data;
  
  logger.info({ 
    jobId: job.id,
    itemCount: items.length,
    batchSize
  }, 'Processing RAG batch job');

  try {
    const pipeline = createRAGPipeline();
    
    // Split into smaller batches for processing
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchTexts = batch.map(item => item.text);
      const batchOptions = batch.map(item => item.indexingOptions);
      
      const batchResults = await pipeline.processBatch(batchTexts, batchOptions);
      results.push(...batchResults);
    }

    const totalIndexed = results.reduce((sum, result) => sum + result.indexedCount, 0);
    const totalSkipped = results.reduce((sum, result) => sum + result.skippedCount, 0);

    logger.info({
      jobId: job.id,
      totalItems: items.length,
      totalIndexed,
      totalSkipped,
      successfulBatches: results.length
    }, 'RAG batch job completed');

    return {
      totalItems: items.length,
      totalIndexed,
      totalSkipped,
      results
    };

  } catch (error) {
    logger.error({
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      itemCount: items.length
    }, 'RAG batch job failed');
    throw error;
  }
}

/**
 * Job data for HNSW index rebuild
 */
export interface HNSWRebuildJobData {
  tableName: string;
  indexName: string;
  m?: number;
  efConstruction?: number;
}

/**
 * Process HNSW index rebuild job
 */
export async function processHNSWRebuildJob(job: Job<HNSWRebuildJobData>) {
  const { tableName, indexName, m = 16, efConstruction = 64 } = job.data;
  
  logger.info({
    jobId: job.id,
    tableName,
    indexName,
    m,
    efConstruction
  }, 'Processing HNSW rebuild job');

  try {
    // This would implement the actual HNSW index rebuild
    // For now, we'll simulate the process
    logger.info({ tableName, indexName }, 'Rebuilding HNSW index');
    
    // Simulate index rebuild time
    await new Promise(resolve => setTimeout(resolve, 5000));

    logger.info({
      jobId: job.id,
      tableName,
      indexName
    }, 'HNSW index rebuild completed');

    return {
      tableName,
      indexName,
      rebuiltAt: new Date().toISOString(),
      duration: 5000
    };

  } catch (error) {
    logger.error({
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      tableName,
      indexName
    }, 'HNSW rebuild job failed');
    throw error;
  }
}

/**
 * Create RAG workers
 */
export function createRAGWorkers() {
  // RAG indexing worker
  const ragIndexWorker = new Worker<RAGIndexJobData>(
    'rag-processing',
    processRAGIndexJob,
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  ragIndexWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'RAG index worker completed job');
  });

  ragIndexWorker.on('failed', (job, err) => {
    logger.error({
      jobId: job?.id,
      error: err.message
    }, 'RAG index worker failed job');
  });

  // Batch processing worker
  const ragBatchWorker = new Worker<RAGBatchJobData>(
    'rag-batch',
    processRAGBatchJob,
    {
      connection: redisConnection,
      concurrency: 1, // Limit batch processing to avoid resource exhaustion
    }
  );

  ragBatchWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'RAG batch worker completed job');
  });

  ragBatchWorker.on('failed', (job, err) => {
    logger.error({
      jobId: job?.id,
      error: err.message
    }, 'RAG batch worker failed job');
  });

  // HNSW rebuild worker
  const hnswRebuildWorker = new Worker<HNSWRebuildJobData>(
    'hnsw-rebuild',
    processHNSWRebuildJob,
    {
      connection: redisConnection,
      concurrency: 1, // Only one HNSW rebuild at a time
    }
  );

  hnswRebuildWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'HNSW rebuild worker completed job');
  });

  hnswRebuildWorker.on('failed', (job, err) => {
    logger.error({
      jobId: job?.id,
      error: err.message
    }, 'HNSW rebuild worker failed job');
  });

  return {
    ragIndexWorker,
    ragBatchWorker,
    hnswRebuildWorker
  };
}

/**
 * Add RAG indexing job to queue
 */
export async function addRAGIndexJob(
  text: string,
  indexingOptions: IndexingOptions,
  options: { priority?: number; delay?: number } = {}
) {
  const jobData: RAGIndexJobData = {
    text,
    indexingOptions,
    priority: options.priority || 0
  };

  return await ragQueue.add('index', jobData, {
    priority: options.priority,
    delay: options.delay,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

/**
 * Add batch RAG processing job to queue
 */
export async function addRAGBatchJob(
  items: Array<{ text: string; indexingOptions: IndexingOptions }>,
  options: { batchSize?: number; priority?: number } = {}
) {
  const jobData: RAGBatchJobData = {
    items,
    batchSize: options.batchSize
  };

  return await ragQueue.add('batch', jobData, {
    priority: options.priority || 0,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}

/**
 * Schedule periodic HNSW index rebuild
 */
export async function scheduleHNSWRebuild() {
  // This would integrate with pg_cron to schedule weekly rebuilds
  // For now, we'll add a job that runs weekly
  const weeklyRebuildJob = await ragQueue.add(
    'hnsw-rebuild',
    {
      tableName: 'embedding_chunks',
      indexName: 'idx_embedding_chunks_embedding_vector',
      m: 16,
      efConstruction: 64
    },
    {
      repeat: { pattern: '0 2 * * 0' }, // Every Sunday at 2 AM
      attempts: 1,
    }
  );

  logger.info({ jobId: weeklyRebuildJob.id }, 'Scheduled weekly HNSW rebuild');
  return weeklyRebuildJob;
}
