/**
 * Move Card Command
 * Task: T088 [US1]
 */

export class MoveCardCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly targetListId: string,
    public readonly targetPosition: number,
  ) {}
}
