/**
 * @file        artifacts/api-server/src/lib/agents/checkpoint.ts
 * @module      Agents / Checkpointing
 * @purpose     Custom PostgreSQL checkpointing for agent orchestration state
 *
 * @ai_instructions
 *   - Implement PostgreSQL-based checkpointing for orchestration state
 *   - Support save, load, and list operations for checkpoints
 *   - Include proper error handling and transaction management
 *   - Support checkpoint versioning and cleanup
 *   - Follow LangGraph checkpointing patterns for compatibility
 *
 * @exports     CheckpointSaver class with database persistence
 * @imports     @workspace/db, @workspace/db/schema
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from "@workspace/db";
import { eq, and, desc, lt } from "drizzle-orm";
import { logger } from "../logger";

// Checkpoint configuration schema
export interface CheckpointConfig {
  threadId: string;
  checkpointNs?: string;
  checkpointId?: string;
}

// Checkpoint data structure
export interface CheckpointData {
  id: string;
  threadId: string;
  checkpointNs: string;
  checkpointId: string;
  step: number;
  value: Record<string, unknown>;
  metadata: Record<string, unknown>;
  config: CheckpointConfig;
  createdAt: string;
  updatedAt: string;
}

// Checkpoint tuple for LangGraph compatibility
export interface CheckpointTuple {
  config: CheckpointConfig;
  checkpoint: CheckpointData;
  metadata: Record<string, unknown>;
}

// Checkpoint saver configuration
export interface CheckpointSaverConfig {
  maxCheckpointsPerThread?: number;
  cleanupIntervalMs?: number;
  enableCompression?: boolean;
}

/**
 * Custom PostgreSQL checkpoint saver for agent orchestration
 * Implements LangGraph-compatible checkpointing patterns
 */
export class CheckpointSaver {
  private config: Required<CheckpointSaverConfig>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CheckpointSaverConfig = {}) {
    this.config = {
      maxCheckpointsPerThread: config.maxCheckpointsPerThread || 100,
      cleanupIntervalMs: config.cleanupIntervalMs || 60 * 60 * 1000, // 1 hour
      enableCompression: config.enableCompression ?? false
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Save a checkpoint to the database
   */
  async put(
    config: CheckpointConfig,
    checkpoint: CheckpointData,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    logger.debug({ 
      threadId: config.threadId,
      checkpointId: checkpoint.checkpointId,
      step: checkpoint.step
    }, 'Saving checkpoint');

    try {
      // Compress checkpoint data if enabled
      let value: string | Record<string, unknown> = checkpoint.value;
      if (this.config.enableCompression) {
        value = await this.compressData(value as Record<string, unknown>);
      }

      // Upsert checkpoint
      await db.transaction(async (tx) => {
        // Check if checkpoint exists
        const existing = await tx
          .select()
          .from(this.getCheckpointTable())
          .where(
            and(
              eq(this.getCheckpointTable().threadId, config.threadId),
              eq(this.getCheckpointTable().checkpointNs, config.checkpointNs || ''),
              eq(this.getCheckpointTable().checkpointId, checkpoint.checkpointId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing checkpoint
          await tx
            .update(this.getCheckpointTable())
            .set({
              step: checkpoint.step,
              value: value as Record<string, unknown>,
              metadata: checkpoint.metadata,
              updatedAt: new Date().toISOString()
            })
            .where(eq(this.getCheckpointTable().id, existing[0].id));
        } else {
          // Insert new checkpoint
          await tx
            .insert(this.getCheckpointTable())
            .values({
              threadId: config.threadId,
              checkpointNs: config.checkpointNs || '',
              checkpointId: checkpoint.checkpointId,
              step: checkpoint.step,
              value: value as Record<string, unknown>,
              metadata: checkpoint.metadata,
              config: config as unknown as Record<string, unknown>,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
        }

        // Enforce max checkpoints per thread
        await this.enforceMaxCheckpoints(tx, config.threadId, config.checkpointNs || '');
      });

      logger.debug({ 
        threadId: config.threadId,
        checkpointId: checkpoint.checkpointId
      }, 'Checkpoint saved successfully');

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        threadId: config.threadId,
        checkpointId: checkpoint.checkpointId
      }, 'Failed to save checkpoint');
      throw error;
    }
  }

  /**
   * Get the latest checkpoint for a thread
   */
  async get(config: CheckpointConfig): Promise<CheckpointTuple | null> {
    logger.debug({ threadId: config.threadId }, 'Getting latest checkpoint');

    try {
      const checkpoint = await db
        .select()
        .from(this.getCheckpointTable())
        .where(
          and(
            eq(this.getCheckpointTable().threadId, config.threadId),
            eq(this.getCheckpointTable().checkpointNs, config.checkpointNs || '')
          )
        )
        .orderBy(desc(this.getCheckpointTable().step))
        .limit(1);

      if (checkpoint.length === 0) {
        logger.debug({ threadId: config.threadId }, 'No checkpoint found');
        return null;
      }

      // Decompress checkpoint data if needed
      let value = checkpoint[0].value;
      if (this.config.enableCompression) {
        value = await this.decompressData(value);
      }

      const checkpointData: CheckpointData = {
        id: checkpoint[0].id,
        threadId: checkpoint[0].threadId,
        checkpointNs: checkpoint[0].checkpointNs,
        checkpointId: checkpoint[0].checkpointId,
        step: checkpoint[0].step,
        value,
        metadata: checkpoint[0].metadata as Record<string, unknown>,
        config: checkpoint[0].config as CheckpointConfig,
        createdAt: checkpoint[0].createdAt,
        updatedAt: checkpoint[0].updatedAt
      };

      logger.debug({ 
        threadId: config.threadId,
        checkpointId: checkpointData.checkpointId,
        step: checkpointData.step
      }, 'Checkpoint retrieved successfully');

      return {
        config,
        checkpoint: checkpointData,
        metadata: checkpoint[0].metadata as Record<string, unknown>
      };

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        threadId: config.threadId
      }, 'Failed to get checkpoint');
      throw error;
    }
  }

  /**
   * Get a specific checkpoint by ID
   */
  async getTuple(config: CheckpointConfig): Promise<CheckpointTuple | null> {
    if (!config.checkpointId) {
      return this.get(config);
    }

    logger.debug({ 
      threadId: config.threadId,
      checkpointId: config.checkpointId
    }, 'Getting specific checkpoint');

    try {
      const checkpoint = await db
        .select()
        .from(this.getCheckpointTable())
        .where(
          and(
            eq(this.getCheckpointTable().threadId, config.threadId),
            eq(this.getCheckpointTable().checkpointNs, config.checkpointNs || ''),
            eq(this.getCheckpointTable().checkpointId, config.checkpointId)
          )
        )
        .limit(1);

      if (checkpoint.length === 0) {
        logger.debug({ 
          threadId: config.threadId,
          checkpointId: config.checkpointId
        }, 'Specific checkpoint not found');
        return null;
      }

      // Decompress checkpoint data if needed
      let value = checkpoint[0].value;
      if (this.config.enableCompression) {
        value = await this.decompressData(value);
      }

      const checkpointData: CheckpointData = {
        id: checkpoint[0].id,
        threadId: checkpoint[0].threadId,
        checkpointNs: checkpoint[0].checkpointNs,
        checkpointId: checkpoint[0].checkpointId,
        step: checkpoint[0].step,
        value,
        metadata: checkpoint[0].metadata as Record<string, unknown>,
        config: checkpoint[0].config as CheckpointConfig,
        createdAt: checkpoint[0].createdAt,
        updatedAt: checkpoint[0].updatedAt
      };

      logger.debug({ 
        threadId: config.threadId,
        checkpointId: checkpointData.checkpointId,
        step: checkpointData.step
      }, 'Specific checkpoint retrieved successfully');

      return {
        config,
        checkpoint: checkpointData,
        metadata: checkpoint[0].metadata as Record<string, unknown>
      };

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        threadId: config.threadId,
        checkpointId: config.checkpointId
      }, 'Failed to get specific checkpoint');
      throw error;
    }
  }

  /**
   * List all checkpoints for a thread
   */
  async list(config: CheckpointConfig, limit?: number): Promise<CheckpointTuple[]> {
    logger.debug({ threadId: config.threadId, limit }, 'Listing checkpoints');

    try {
      const query = db
        .select()
        .from(this.getCheckpointTable())
        .where(
          and(
            eq(this.getCheckpointTable().threadId, config.threadId),
            eq(this.getCheckpointTable().checkpointNs, config.checkpointNs || '')
          )
        )
        .orderBy(desc(this.getCheckpointTable().step));

      if (limit) {
        query.limit(limit);
      }

      const checkpoints = await query;

      const results: CheckpointTuple[] = [];

      for (const checkpoint of checkpoints) {
        // Decompress checkpoint data if needed
        let value = checkpoint.value;
        if (this.config.enableCompression) {
          value = await this.decompressData(value);
        }

        const checkpointData: CheckpointData = {
          id: checkpoint.id,
          threadId: checkpoint.threadId,
          checkpointNs: checkpoint.checkpointNs,
          checkpointId: checkpoint.checkpointId,
          step: checkpoint.step,
          value,
          metadata: checkpoint.metadata as Record<string, unknown>,
          config: checkpoint.config as CheckpointConfig,
          createdAt: checkpoint.createdAt,
          updatedAt: checkpoint.updatedAt
        };

        results.push({
          config,
          checkpoint: checkpointData,
          metadata: checkpoint.metadata as Record<string, unknown>
        });
      }

      logger.debug({ 
        threadId: config.threadId,
        count: results.length
      }, 'Checkpoints listed successfully');

      return results;

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        threadId: config.threadId
      }, 'Failed to list checkpoints');
      throw error;
    }
  }

  /**
   * Delete checkpoints for a thread
   */
  async delete(config: CheckpointConfig): Promise<void> {
    logger.debug({ threadId: config.threadId }, 'Deleting checkpoints');

    try {
      await db
        .delete(this.getCheckpointTable())
        .where(
          and(
            eq(this.getCheckpointTable().threadId, config.threadId),
            eq(this.getCheckpointTable().checkpointNs, config.checkpointNs || '')
          )
        );

      logger.debug({ threadId: config.threadId }, 'Checkpoints deleted successfully');

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        threadId: config.threadId
      }, 'Failed to delete checkpoints');
      throw error;
    }
  }

  /**
   * Get checkpoint statistics
   */
  async getStats(): Promise<{
    totalCheckpoints: number;
    totalThreads: number;
    oldestCheckpoint: string | null;
    newestCheckpoint: string | null;
  }> {
    try {
      const [totalCheckpoints, threadStats, dateStats] = await Promise.all([
        db.select().from(this.getCheckpointTable()),
        db
          .select({ threadId: this.getCheckpointTable().threadId })
          .from(this.getCheckpointTable())
          .groupBy(this.getCheckpointTable().threadId),
        db
          .select({
            oldest: this.getCheckpointTable().createdAt,
            newest: this.getCheckpointTable().createdAt
          })
          .from(this.getCheckpointTable())
          .orderBy(this.getCheckpointTable().createdAt)
          .limit(1)
      ]);

      return {
        totalCheckpoints: totalCheckpoints.length,
        totalThreads: threadStats.length,
        oldestCheckpoint: dateStats[0]?.oldest || null,
        newestCheckpoint: dateStats[0]?.newest || null
      };

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to get checkpoint stats');
      throw error;
    }
  }

  /**
   * Clean up old checkpoints
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    logger.info({ olderThanDays }, 'Starting checkpoint cleanup');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db
        .delete(this.getCheckpointTable())
        .where(lt(this.getCheckpointTable().createdAt, cutoffDate.toISOString()));

      const deletedCount = result.rowCount || 0;

      logger.info({ 
        olderThanDays,
        deletedCount
      }, 'Checkpoint cleanup completed');

      return deletedCount;

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        olderThanDays
      }, 'Failed to cleanup checkpoints');
      throw error;
    }
  }

  /**
   * Close the checkpoint saver and clean up resources
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    logger.info('Checkpoint saver closed');
  }

  /**
   * Get the checkpoint table (mock implementation)
   * In a real implementation, this would reference an actual database table
   */
  private getCheckpointTable() {
    // Mock table structure - in real implementation this would be:
    // return agentCheckpointsTable;
    
    // For now, return a mock table interface
    return {
      id: 'id',
      threadId: 'threadId',
      checkpointNs: 'checkpointNs',
      checkpointId: 'checkpointId',
      step: 'step',
      value: 'value',
      metadata: 'metadata',
      config: 'config',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    } as any;
  }

  /**
   * Enforce maximum checkpoints per thread
   */
  private async enforceMaxCheckpoints(
    tx: any,
    threadId: string,
    checkpointNs: string
  ): Promise<void> {
    const count = await tx
      .select()
      .from(this.getCheckpointTable())
      .where(
        and(
          eq(this.getCheckpointTable().threadId, threadId),
          eq(this.getCheckpointTable().checkpointNs, checkpointNs)
        )
      );

    if (count.length > this.config.maxCheckpointsPerThread) {
      // Delete oldest checkpoints
      const toDelete = count
        .sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(0, count.length - this.config.maxCheckpointsPerThread);

      for (const checkpoint of toDelete) {
        await tx
          .delete(this.getCheckpointTable())
          .where(eq(this.getCheckpointTable().id, checkpoint.id));
      }

      logger.debug({ 
        threadId,
        deletedCount: toDelete.length
      }, 'Enforced max checkpoints per thread');
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.config.cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(async () => {
        try {
          await this.cleanup();
        } catch (error) {
          logger.error({ 
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'Automatic cleanup failed');
        }
      }, this.config.cleanupIntervalMs);
    }
  }

  /**
   * Compress checkpoint data
   */
  private async compressData(data: Record<string, unknown>): Promise<string> {
    // In a real implementation, this would use compression
    // For now, just serialize to JSON
    return JSON.stringify(data);
  }

  /**
   * Decompress checkpoint data
   */
  private async decompressData(data: string): Promise<Record<string, unknown>> {
    // In a real implementation, this would decompress the data
    // For now, just parse from JSON
    return JSON.parse(data);
  }
}

/**
 * Create checkpoint saver instance
 */
export function createCheckpointSaver(config?: CheckpointSaverConfig): CheckpointSaver {
  return new CheckpointSaver(config);
}

/**
 * Global checkpoint saver instance
 */
export const checkpointSaver = createCheckpointSaver();
