/**
 * Add Comment Command (T137)
 * User Story 2: Enrich Cards with Details
 */

export class AddCommentCommand {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly content: string,
  ) {}
}
