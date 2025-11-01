import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BoardGateway } from './board.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DomainEventEmitter } from '../../domain/shared/domain-event.emitter';
import { WebSocketEventPublisherService } from './websocket-event-publisher.service';
import { DomainEventSubscriber } from './domain-event-subscriber';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Set this to `true` to use wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: '.',
      // Set this to `true` if you want to emit the newListener event
      newListener: false,
      // Set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // The maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
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
