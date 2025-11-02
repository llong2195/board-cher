/**
 * Move List Command
 * Task: T086 [US1]
 */

export class MoveListCommand {
  constructor(
    public readonly listId: string,
    public readonly userId: string,
    public readonly targetPosition: number,
  ) {}
}
