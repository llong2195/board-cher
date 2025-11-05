/**
 * Auth Module
 * Provides authentication and authorization infrastructure including:
 * - JWT Strategy
 * - JWT Auth Guard
 * - Board Permission Guard
 * - Organization Permission Guard
 *
 * This module imports all necessary repositories for guards to function
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { UserModule } from '../../domain/user/user.module';
import { BoardMemberEntity } from '../persistence/entities/board-member.entity';
import { BoardEntity } from '../persistence/entities/board.entity';
import { CardEntity } from '../persistence/entities/card.entity';
import { ListEntity } from '../persistence/entities/list.entity';
import { OrganizationMemberEntity } from '../persistence/entities/organization-member.entity';
import { OrganizationEntity } from '../persistence/entities/organization.entity';
import { BoardPermissionGuard } from './guards/board-permission.guard';
import { OrganizationPermissionGuard } from './guards/organization-permission.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
              '1h') as StringValue,
          },
        }; // Type assertion needed due to JWT library string union type issues
      },
    }),
    TypeOrmModule.forFeature([
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
      OrganizationEntity,
      ListEntity,
      CardEntity,
    ]),
    UserModule, // Import UserModule for IUserRepository
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    BoardPermissionGuard,
    OrganizationPermissionGuard,
  ],
  exports: [
    JwtStrategy,
    JwtAuthGuard,
    BoardPermissionGuard,
    OrganizationPermissionGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
