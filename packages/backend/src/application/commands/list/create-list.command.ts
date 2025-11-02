/**
 * Create List Command
 * Task: T085 [US1]
 */

export class CreateListCommand {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly position?: number,
  ) {}
}
