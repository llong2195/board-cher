export class FilterCardsQuery {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
    public readonly labelIds?: string[],
    public readonly assigneeIds?: string[],
    public readonly dueDateFilter?: 'today' | 'overdue' | 'none',
    public readonly dueDateStart?: Date,
    public readonly dueDateEnd?: Date,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {}
}
