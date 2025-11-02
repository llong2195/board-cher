/**
 * Create Board Command
 * Task: T080 [US1]
 */

export class CreateBoardCommand {
  constructor(
    public readonly name: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly description?: string,
    public readonly color?: string,
  ) {}
}
