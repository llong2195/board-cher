/**
 * Toggle Checklist Item Command (T142)
 * User Story 2: Enrich Cards with Details
 */

export class ToggleChecklistItemCommand {
  constructor(
    public readonly itemId: string,
    public readonly userId: string,
  ) {}
}
