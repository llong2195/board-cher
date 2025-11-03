/**
 * T212 - Get Assigned Cards Query
 * User Story 6: Card Assignment and Notifications
 *
 * Query to get all cards assigned to a specific user
 */

export class GetAssignedCardsQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 50,
  ) {}
}
