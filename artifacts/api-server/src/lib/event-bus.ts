/**
 * @file        artifacts/api-server/src/lib/event-bus.ts
 * @module      API Server / Event Bus
 * @purpose     Event bus abstraction wrapping outbox publisher and subscriber interfaces
 *
 * @ai_instructions
 *   - Provide both synchronous (EventEmitter) and asynchronous (outbox) publishing
 *   - Implement idempotency checking for event handlers
 *   - Support tenant-scoped event processing
 *   - DO NOT allow direct database access from event handlers
 *
 * @exports     EventBus, EventHandler, EventSubscription
 * @imports     node:events, ./outbox, ./domain-events, @workspace/db
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { EventEmitter } from "node:events";
import { eq, and } from "drizzle-orm";
import { OutboxPublisher, outboxProcessor } from "./outbox";
import { DomainEvent, BaseDomainEvent } from "./domain-events";
import { db, processedEventsTable } from "@workspace/db";

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  eventType: T['type'];
  handler: (event: T) => Promise<void>;
  moduleId: string; // For architectural enforcement
}

export interface EventSubscription {
  id: string;
  eventType: string;
  moduleId: string;
  handler: EventHandler['handler'];
  isActive: boolean;
}

export class EventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private isStarted = false;

  constructor() {
    super();
    this.setupOutboxListener();
  }

  /**
   * Start the event bus and begin processing outbox events
   */
  async start(): Promise<void> {
    if (this.isStarted) return;
    
    // Start the outbox processor
    await outboxProcessor.start();
    
    // Set up outbox event listener
    outboxProcessor.on("domainEvent", this.handleOutboxEvent.bind(this));
    
    this.isStarted = true;
    console.log("🚀 Event bus started");
  }

  /**
   * Stop the event bus and outbox processing
   */
  async stop(): Promise<void> {
    if (!this.isStarted) return;
    
    await outboxProcessor.stop();
    this.removeAllListeners();
    this.subscriptions.clear();
    
    this.isStarted = false;
    console.log("🛑 Event bus stopped");
  }

  /**
   * Publish an event synchronously (in-process)
   * Use for immediate, same-process communication
   */
  publishSync(event: DomainEvent): void {
    this.emit(event.type, event);
  }

  /**
   * Publish an event asynchronously via outbox
   * Use for guaranteed delivery across module boundaries
   */
  async publishAsync(event: DomainEvent): Promise<void> {
    await OutboxPublisher.publish({
      type: event.type,
      data: event.data,
      tenant_id: event.tenant_id,
      metadata: event.metadata
    });
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>['handler'],
    moduleId: string
  ): string {
    const subscriptionId = `${moduleId}-${eventType}-${Date.now()}`;
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      moduleId,
      handler: handler as EventHandler['handler'],
      isActive: true
    };

    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);

    // Set up event listener
    this.on(eventType, async (event: T) => {
      if (!subscription.isActive) return;
      
      try {
        await this.processEventWithIdempotency(event, subscription);
      } catch (error) {
        console.error(`❌ Error processing event ${eventType} in module ${moduleId}:`, error);
        // In production, you might want to implement retry logic here
      }
    });

    console.log(`📝 Module ${moduleId} subscribed to ${eventType}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.off(subscription.eventType, subscription.handler);
      this.subscriptions.delete(subscriptionId);
      console.log(`🗑️ Unsubscribed from ${subscription.eventType}`);
    }
  }

  /**
   * Get active subscriptions for a module
   */
  getModuleSubscriptions(moduleId: string): EventSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.moduleId === moduleId && sub.isActive);
  }

  /**
   * Process an event with idempotency checking
   */
  private async processEventWithIdempotency(
    event: DomainEvent, 
    subscription: EventSubscription
  ): Promise<void> {
    // Check if event has already been processed by this handler
    const processedEvent = await db.select()
      .from(processedEventsTable)
      .where(
        and(
          eq(processedEventsTable.eventId, event.id),
          eq(processedEventsTable.eventType, event.type),
          eq(processedEventsTable.processorId, subscription.id)
        )
      )
      .limit(1);

    if (processedEvent) {
      console.log(`⏭️ Event ${event.id} already processed by ${subscription.id}`);
      return;
    }

    // Process the event
    await subscription.handler(event);

    // Mark as processed
    await db.insert(processedEventsTable).values({
      eventId: event.id,
      eventType: event.type,
      tenantId: event.tenant_id,
      processorId: subscription.id
    });

    console.log(`✅ Processed event ${event.type} (${event.id}) in module ${subscription.moduleId}`);
  }

  /**
   * Set up listener for outbox events
   */
  private setupOutboxListener(): void {
    outboxProcessor.on("domainEvent", async (outboxEvent: {
      type: string;
      data: Record<string, unknown>;
      tenant_id: string;
      id: string;
    }) => {
      // Convert outbox event back to domain event
      const domainEvent: BaseDomainEvent = {
        id: outboxEvent.id,
        type: outboxEvent.type,
        tenant_id: outboxEvent.tenant_id,
        occurred_at: new Date().toISOString(),
        data: outboxEvent.data
      };

      // Emit for synchronous processing
      this.emit(outboxEvent.type, domainEvent);
    });
  }

  /**
   * Handle events from the outbox processor
   */
  private async handleOutboxEvent(outboxEvent: {
    type: string;
    data: Record<string, unknown>;
    tenant_id: string;
    id: string;
  }): Promise<void> {
    // This method is called by the outbox processor
    // The actual event emission is handled in setupOutboxListener
    console.log(`📦 Processing outbox event: ${outboxEvent.type}`);
  }

  /**
   * Get event bus statistics
   */
  async getStats(): Promise<{
    subscriptions: number;
    activeSubscriptions: number;
    outboxStats: {
      pending: number;
      processed: number;
      failed: number;
    };
  }> {
    const activeSubs = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive).length;
    
    const outboxStats = await outboxProcessor.getStats();

    return {
      subscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubs,
      outboxStats
    };
  }
}

// Singleton instance
export const eventBus = new EventBus();
