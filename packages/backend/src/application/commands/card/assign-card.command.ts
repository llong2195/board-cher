/**
 * T210 - Assign Card Command
 * User Story 6: Card Assignment and Notifications
 *
 * Command to assign a user to a card
 */

export class AssignCardCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly assignedBy: string,
  ) {}
}
