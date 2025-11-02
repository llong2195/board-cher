/**
 * Card Domain Model (T135 - Updated for US2)
 *
 * Represents a work item or task on the board.
 * This is an aggregate root in the DDD context.
 *
 * US2 Enhancements:
 * - Comments: Text discussions on the card
 * - Attachments: File uploads with metadata
 * - Labels: Color-coded categorization
 * - Checklists: Sub-task tracking with progress
 */

export class Card {
  // US2 collections (lazy-loaded from repository)
  private _commentIds: string[] = [];
  private _attachmentIds: string[] = [];
  private _labelIds: string[] = [];
  private _checklistIds: string[] = [];

  constructor(
    public readonly id: string,
    public listId: string,
    public title: string,
    public description: string | null,
    public position: number,
    public dueDate: Date | null,
    public isArchived: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly createdBy: string,
  ) {
    this.validate();
  }

  /**
   * Create a new Card instance
   */
  static create(
    id: string,
    listId: string,
    title: string,
    position: number,
    createdBy: string,
    description: string | null = null,
    dueDate: Date | null = null,
  ): Card {
    return new Card(
      id,
      listId,
      title,
      description,
      position,
      dueDate,
      false, // isArchived
      new Date(),
      new Date(),
      createdBy,
    );
  }

  /**
   * Update card details
   */
  update(
    title?: string,
    description?: string | null,
    dueDate?: Date | null,
  ): void {
    if (title !== undefined) {
      this.title = title;
    }
    if (description !== undefined) {
      this.description = description;
    }
    if (dueDate !== undefined) {
      this.dueDate = dueDate;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Move card to a different list and/or position
   */
  moveTo(newListId: string, newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.listId = newListId;
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  /**
   * Update card position within the same list
   */
  updatePosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  /**
   * Archive the card
   */
  archive(): void {
    if (this.isArchived) {
      throw new Error('Card is already archived');
    }
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  /**
   * Restore the card from archive
   */
  restore(): void {
    if (!this.isArchived) {
      throw new Error('Card is not archived');
    }
    this.isArchived = false;
    this.updatedAt = new Date();
  }

  /**
   * Set due date for the card
   */
  setDueDate(dueDate: Date | null): void {
    if (dueDate && dueDate < new Date()) {
      throw new Error('Due date cannot be in the past');
    }
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  /**
   * Check if card is overdue
   */
  isOverdue(): boolean {
    if (!this.dueDate || this.isArchived) {
      return false;
    }
    return this.dueDate < new Date();
  }

  /**
   * US2: Set enrichment IDs (for hydration from repository)
   */
  setCommentIds(ids: string[]): void {
    this._commentIds = ids;
  }

  setAttachmentIds(ids: string[]): void {
    this._attachmentIds = ids;
  }

  setLabelIds(ids: string[]): void {
    this._labelIds = ids;
  }

  setChecklistIds(ids: string[]): void {
    this._checklistIds = ids;
  }

  /**
   * US2: Get enrichment IDs
   */
  getCommentIds(): string[] {
    return [...this._commentIds];
  }

  getAttachmentIds(): string[] {
    return [...this._attachmentIds];
  }

  getLabelIds(): string[] {
    return [...this._labelIds];
  }

  getChecklistIds(): string[] {
    return [...this._checklistIds];
  }

  /**
   * US2: Add enrichment
   */
  addComment(commentId: string): void {
    if (!this._commentIds.includes(commentId)) {
      this._commentIds.push(commentId);
      this.updatedAt = new Date();
    }
  }

  removeComment(commentId: string): void {
    const index = this._commentIds.indexOf(commentId);
    if (index > -1) {
      this._commentIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  addAttachment(attachmentId: string): void {
    if (!this._attachmentIds.includes(attachmentId)) {
      this._attachmentIds.push(attachmentId);
      this.updatedAt = new Date();
    }
  }

  removeAttachment(attachmentId: string): void {
    const index = this._attachmentIds.indexOf(attachmentId);
    if (index > -1) {
      this._attachmentIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  addLabel(labelId: string): void {
    if (!this._labelIds.includes(labelId)) {
      this._labelIds.push(labelId);
      this.updatedAt = new Date();
    }
  }

  removeLabel(labelId: string): void {
    const index = this._labelIds.indexOf(labelId);
    if (index > -1) {
      this._labelIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  addChecklist(checklistId: string): void {
    if (!this._checklistIds.includes(checklistId)) {
      this._checklistIds.push(checklistId);
      this.updatedAt = new Date();
    }
  }

  removeChecklist(checklistId: string): void {
    const index = this._checklistIds.indexOf(checklistId);
    if (index > -1) {
      this._checklistIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * US2: Get enrichment counts
   */
  getCommentCount(): number {
    return this._commentIds.length;
  }

  getAttachmentCount(): number {
    return this._attachmentIds.length;
  }

  getLabelCount(): number {
    return this._labelIds.length;
  }

  getChecklistCount(): number {
    return this._checklistIds.length;
  }

  /**
   * Validate card invariants
   */
  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Card title cannot be empty');
    }
    if (this.title.length > 500) {
      throw new Error('Card title cannot exceed 500 characters');
    }
    if (this.description && this.description.length > 50000) {
      throw new Error('Card description cannot exceed 50,000 characters');
    }
    if (!this.listId) {
      throw new Error('Card must belong to a list');
    }
    if (this.position < 0) {
      throw new Error('Card position cannot be negative');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      listId: this.listId,
      title: this.title,
      description: this.description,
      position: this.position,
      dueDate: this.dueDate,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      isOverdue: this.isOverdue(),
      // US2 counts
      commentCount: this.getCommentCount(),
      attachmentCount: this.getAttachmentCount(),
      labelCount: this.getLabelCount(),
      checklistCount: this.getChecklistCount(),
    };
  }
}
