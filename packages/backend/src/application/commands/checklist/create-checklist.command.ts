/**
 * Create Checklist Command (T141)
 * User Story 2: Enrich Cards with Details
 */

export class CreateChecklistCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly position?: number,
  ) {}
}
