/**
 * DTO for toggling a checklist item (T148)
 * User Story 2: Enrich Cards with Details
 *
 * This DTO is intentionally empty as the toggle action
 * doesn't require a request body. The item ID comes from the URL.
 */
export class ToggleItemDto {
  // No properties needed - toggle is idempotent
}
