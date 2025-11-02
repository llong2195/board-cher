/**
 * List Boards Query
 * Task: T084 [US1]
 */

export class ListBoardsQuery {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly includeArchived: boolean = false,
  ) {}
}
