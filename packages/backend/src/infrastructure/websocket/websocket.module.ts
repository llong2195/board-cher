import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BoardGateway } from './board.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn:
            (configService.get<string>('JWT_ACCESS_EXPIRY') as any) || '15m',
        },
        global: true,
      }),
    }),
  ],
  providers: [BoardGateway],
  exports: [BoardGateway],
})
export class WebSocketModule {}
