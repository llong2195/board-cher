/**
 * T256 - Activity Response DTO
 * User Story 7: Activity History and Audit Trail
 *
 * Data Transfer Object for activity responses.
 * Includes human-readable action descriptions.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  ActivityActionType,
  ActivityEntityType,
} from '../../../infrastructure/persistence/entities/activity.entity';

export class ActivityResponseDto {
  @ApiProperty({
    description: 'Activity unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID who performed the action',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId!: string;

  @ApiProperty({
    description: 'User name who performed the action',
    example: 'John Doe',
    required: false,
  })
  userName?: string;

  @ApiProperty({
    description: 'Board ID (if board-level activity)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  boardId!: string | null;

  @ApiProperty({
    description: 'Card ID (if card-level activity)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  cardId!: string | null;

  @ApiProperty({
    description: 'Action type performed',
    enum: ActivityActionType,
    example: ActivityActionType.CARD_CREATED,
  })
  actionType!: ActivityActionType;

  @ApiProperty({
    description: 'Type of entity affected',
    enum: ActivityEntityType,
    example: ActivityEntityType.CARD,
  })
  entityType!: ActivityEntityType;

  @ApiProperty({
    description: 'ID of the entity affected',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  entityId!: string;

  @ApiProperty({
    description: 'Additional metadata about the action',
    example: { name: 'New Card Title', listId: '...' },
    required: false,
  })
  metadata!: Record<string, any> | null;

  @ApiProperty({
    description: 'Human-readable description of the activity',
    example: 'created card "New Feature"',
  })
  description!: string;

  @ApiProperty({
    description: 'When the activity occurred',
    example: '2025-11-04T10:30:00Z',
  })
  createdAt!: Date;
}

export class PaginatedActivityResponseDto {
  @ApiProperty({
    description: 'Array of activities',
    type: [ActivityResponseDto],
  })
  data!: ActivityResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    example: { page: 1, limit: 20, total: 150 },
  })
  pagination!: {
    page: number;
    limit: number;
    total: number;
  };
}
