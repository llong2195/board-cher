import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BoardGateway } from './board.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DomainEventEmitter } from '../../domain/shared/domain-event.emitter';
import { WebSocketEventPublisherService } from './websocket-event-publisher.service';
import { DomainEventSubscriber } from './domain-event-subscriber';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn =
          configService.get<string>('JWT_ACCESS_EXPIRY') || '15m';
        return {
          secret: configService.get<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
          },
          global: true,
        };
      },
    }),
  ],
  providers: [
    BoardGateway,
    DomainEventEmitter,
    WebSocketEventPublisherService,
    DomainEventSubscriber,
  ],
  exports: [BoardGateway, DomainEventEmitter],
})
export class WebSocketModule {}
