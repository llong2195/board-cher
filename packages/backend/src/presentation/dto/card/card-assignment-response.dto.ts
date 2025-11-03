/**
 * T215 - Assignment Response DTO
 * User Story 6: Card Assignment and Notifications
 */

import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;
}

export class CardAssignmentResponseDto {
  @ApiProperty({
    description: 'Assignment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Card ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'Assigned user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'User who performed the assignment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  assignedBy!: string;

  @ApiProperty({
    description: 'When the assignment was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  assignedAt!: Date;

  @ApiProperty({
    description: 'Assigned user details',
    type: UserInfoDto,
    required: false,
  })
  user?: UserInfoDto;
}
