import { Injectable } from '@nestjs/common';

import { RabbitMQConnectionService } from './rabbitmq-connection.service';

import { EntityManager } from 'typeorm';
import { PublishEventsEntity } from '../entities/published-events.entity';
import { EventType } from '../enums/event-types';



@Injectable()
export class EventPublisherService {
  constructor(
    private readonly rabbitMQConnectionService: RabbitMQConnectionService,

    private em: EntityManager,
  ) {}

  async publishToExchange(eventType: EventType, message: any) {
    return
    await this.rabbitMQConnectionService.createConnection();
    const channel = this.rabbitMQConnectionService.getChannel();

    await channel.assertExchange(eventType, 'fanout', { durable: true });

    let eventData = JSON.stringify(message);

    channel.publish(eventType, '', Buffer.from(eventData));

    let event = new PublishEventsEntity();

    event.eventType = eventType;

    event.userId = message.userId || '';

    event.data = eventData;

    await this.em.save(event);
  }
}
