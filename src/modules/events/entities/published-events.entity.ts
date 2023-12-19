import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

import { EventType } from '../enums/event-types';

@Entity()
export class PublishEventsEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventType: EventType;

  @Column('text', { nullable: true })
  userId?: string;

  @Column({ type: 'text' })
  data: string;

  @CreateDateColumn()
  createdAt?: Date;
}
