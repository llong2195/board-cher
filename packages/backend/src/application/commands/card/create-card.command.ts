/**
 * Create Card Command
 * Task: T087 [US1]
 */

export class CreateCardCommand {
  constructor(
    public readonly listId: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly description?: string,
    public readonly position?: number,
  ) {}
}
