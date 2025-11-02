/**
 * Update Board Command
 * Task: T081 [US1]
 */

export class UpdateBoardCommand {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly color?: string | null,
  ) {}
}
