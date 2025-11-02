/**
 * Create Label Command (T139)
 * User Story 2: Enrich Cards with Details
 */

export class CreateLabelCommand {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
    public readonly color: string,
    public readonly name?: string,
  ) {}
}
