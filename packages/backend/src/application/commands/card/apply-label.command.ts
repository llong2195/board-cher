/**
 * Apply Label to Card Command (T140)
 * User Story 2: Enrich Cards with Details
 */

export class ApplyLabelToCardCommand {
  constructor(
    public readonly cardId: string,
    public readonly labelId: string,
    public readonly userId: string,
  ) {}
}
