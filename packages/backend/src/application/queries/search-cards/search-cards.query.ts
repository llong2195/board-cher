export class SearchCardsQuery {
  constructor(
    public readonly boardId: string,
    public readonly userId: string,
    public readonly searchTerm: string,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {}
}
