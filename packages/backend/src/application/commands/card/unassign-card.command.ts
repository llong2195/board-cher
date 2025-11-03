/**
 * T211 - Unassign Card Command
 * User Story 6: Card Assignment and Notifications
 *
 * Command to unassign a user from a card
 */

export class UnassignCardCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly unassignedBy: string,
  ) {}
}
