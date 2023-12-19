import { NestFactory } from '@nestjs/core';

import { Transport } from '@nestjs/microservices';
import { EventConsumerModule } from './modules/events/event-consumer.module';

async function bootstrap() {
  
  const app = await NestFactory.createMicroservice(EventConsumerModule, 
    {
    transport: Transport.RMQ,
    options: {
        urls: ['amqp://51.103.47.66'],
        queue: 'events_queue',
      // false = manual acknowledgement; true = automatic acknowledgment
      noAck: false,
      // Get one by one
      prefetchCount: 1
    }
  });
  await app.listen()
}
bootstrap();