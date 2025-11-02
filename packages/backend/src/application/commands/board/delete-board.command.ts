/**
 * Delete Board Command
 * Task: T082 [US1]
 */

export class DeleteBoardCommand {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
  ) {}
}
