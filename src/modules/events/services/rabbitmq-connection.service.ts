import { Inject, Injectable } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';

import { GlobalConfig, globalConfig } from '../../../config/config';
@Injectable()
export class RabbitMQConnectionService {
  private connection: Connection;
  private channel: Channel;
  @Inject(globalConfig.KEY) cfg: GlobalConfig;
 

  


  //Todo extract to an env file
  async createConnection() {
    this.connection = await connect(this.cfg.rabbitMQL.url); // Replace with your RabbitMQ server URL
    this.channel = await this.connection.createChannel();
  }


  getChannel(): Channel {
    return this.channel;
  }
}
