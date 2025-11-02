import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../infrastructure/persistence/entities/user.entity';
import { UserRepositoryImpl } from '../../infrastructure/persistence/repositories/user.repository.impl';
import { AuthService } from '../../application/services/auth.service';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../infrastructure/auth/jwt.strategy';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,
    },
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: ['IUserRepository', AuthService, JwtAuthGuard],
})
export class UserModule {}
