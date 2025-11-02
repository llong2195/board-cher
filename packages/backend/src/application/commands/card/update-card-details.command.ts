/**
 * Update Card Details Command (T143)
 * User Story 2: Enrich Cards with Details
 */

export class UpdateCardDetailsCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly dueDate?: Date | null,
  ) {}
}
