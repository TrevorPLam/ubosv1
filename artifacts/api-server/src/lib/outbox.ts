/**
 * @file        artifacts/api-server/src/lib/outbox.ts
 * @module      API Server / Outbox
 * @purpose     Transactional outbox pattern implementation for reliable cross-module events
 *
 * @ai_instructions
 *   - All outbox operations must be transactional with business operations
 *   - Use PostgreSQL LISTEN/NOTIFY for low-latency delivery
 *   - Implement idempotency handling for at-least-once delivery
 *   - DO NOT process outbox events synchronously in the same transaction
 *
 * @exports     OutboxPublisher, OutboxProcessor, OutboxMessage
 * @imports     @workspace/db, node:crypto, node:events
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { pool, db, outboxMessagesTable, processedEventsTable } from "@workspace/db";

export interface OutboxMessage {
  id: string;
  type: string;
  content: Record<string, unknown>;
  tenant_id: string;
  occurred_on_utc: Date;
  processed_on_utc?: Date;
  error?: string;
  retry_count?: number;
}

export interface DomainEvent {
  type: string;
  data: Record<string, unknown>;
  tenant_id: string;
  metadata?: Record<string, unknown>;
}

export class OutboxPublisher {
  /**
   * Add a domain event to the outbox table within the current transaction
   * This must be called within a database transaction
   */
  static async publish(event: DomainEvent): Promise<void> {
    const outboxMessage = {
      id: randomUUID(),
      type: event.type,
      content: event.data,
      tenantId: event.tenant_id,
      occurredOnUtc: new Date().toISOString(),
    };

    // Insert into outbox table - this will be part of the current transaction
    await db.insert(outboxMessagesTable).values(outboxMessage);
  }

  /**
   * Add multiple domain events atomically
   */
  static async publishBatch(events: DomainEvent[]): Promise<void> {
    const messages = events.map(event => ({
      id: randomUUID(),
      type: event.type,
      content: event.data,
      tenantId: event.tenant_id,
      occurredOnUtc: new Date().toISOString(),
    }));

    await db.insert(outboxMessagesTable).values(messages);
  }
}

export class OutboxProcessor extends EventEmitter {
  private isProcessing = false;
  private pollInterval = 5000; // 5 seconds
  private maxRetries = 3;
  private batchSize = 50;

  constructor() {
    super();
    this.setupPostgresListener();
  }

  /**
   * Start the outbox processor
   */
  async start(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log("🚀 Outbox processor started");
    
    // Start polling for unprocessed messages
    this.poll();
    
    // Emit startup event
    this.emit("started");
  }

  /**
   * Stop the outbox processor
   */
  async stop(): Promise<void> {
    this.isProcessing = false;
    console.log("🛑 Outbox processor stopped");
    this.emit("stopped");
  }

  /**
   * Setup PostgreSQL LISTEN/NOTIFY for low-latency delivery
   */
  private async setupPostgresListener(): Promise<void> {
    const client = await pool.connect();
    
    client.on("notification", (msg) => {
      if (msg.channel === "outbox_notifications") {
        console.log("📢 Received outbox notification:", msg.payload);
        // Trigger immediate processing
        this.processBatch();
      }
    });
    
    client.on("error", (err: Error) => {
      console.error("❌ PostgreSQL listener error:", err);
    });
    
    await client.query("LISTEN outbox_notifications");
  }

  /**
   * Poll for unprocessed outbox messages
   */
  private async poll(): Promise<void> {
    while (this.isProcessing) {
      try {
        await this.processBatch();
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      } catch (error) {
        console.error("❌ Outbox polling error:", error);
        await new Promise(resolve => setTimeout(resolve, this.pollInterval * 2)); // Backoff on error
      }
    }
  }

  /**
   * Process a batch of unprocessed outbox messages
   */
  private async processBatch(): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      // Fetch unprocessed messages with advisory lock to prevent duplicate processing
      const messagesQuery = `
        SELECT id, type, content, tenant_id, occurred_on_utc, retry_count
        FROM outbox_messages 
        WHERE processed_on_utc IS NULL 
        AND retry_count < $1
        ORDER BY occurred_on_utc ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      `;
      
      const result = await client.query(messagesQuery, [this.maxRetries, this.batchSize]);
      const messages = result.rows;
      
      if (messages.length === 0) {
        await client.query("ROLLBACK");
        return;
      }
      
      console.log(`📦 Processing ${messages.length} outbox messages`);
      
      // Process each message
      for (const message of messages) {
        try {
          // Emit the domain event
          this.emit("domainEvent", {
            type: message.type,
            data: message.content,
            tenant_id: message.tenant_id,
            id: message.id,
          });
          
          // Mark as processed
          await client.query(
            `UPDATE outbox_messages 
             SET processed_on_utc = NOW() 
             WHERE id = $1`,
            [message.id]
          );
          
          console.log(`✅ Processed outbox message: ${message.type}`);
          
        } catch (error) {
          console.error(`❌ Failed to process outbox message ${message.id}:`, error);
          
          // Increment retry count
          await client.query(
            `UPDATE outbox_messages 
             SET retry_count = COALESCE(retry_count, 0) + 1, 
                 error = $2 
             WHERE id = $1`,
            [message.id, error instanceof Error ? error.message : "Unknown error"]
          );
        }
      }
      
      await client.query("COMMIT");
      
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<{
    pending: number;
    processed: number;
    failed: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN processed_on_utc IS NULL THEN 1 END) as pending,
        COUNT(CASE WHEN processed_on_utc IS NOT NULL THEN 1 END) as processed,
        COUNT(CASE WHEN retry_count >= $1 THEN 1 END) as failed
      FROM outbox_messages
    `;
    
    const result = await pool.query(statsQuery, [this.maxRetries]);
    const stats = result.rows[0];
    
    return {
      pending: parseInt(stats.pending),
      processed: parseInt(stats.processed),
      failed: parseInt(stats.failed),
    };
  }
}

// Singleton instance
export const outboxProcessor = new OutboxProcessor();
