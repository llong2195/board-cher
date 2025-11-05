/**
 * Aggregate Root Base Class
 *
 * Provides common functionality for all aggregate roots including:
 * - Domain event management
 * - Event publishing mechanism
 *
 * Based on DDD principles for aggregate pattern implementation
 */

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }

  abstract get eventName(): string;
}

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Add a domain event to be published when the aggregate is saved
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get all domain events that have been raised
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Clear all domain events after they have been published
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if there are any domain events
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
