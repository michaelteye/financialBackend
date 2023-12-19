import { LEVEL } from '../../auth/entities/enums/level.enum';
import { Column, Entity, JoinColumn } from 'typeorm';

import { AbstractEntity } from './abstract-entity';
import { UserEntity } from './user.entity';

@Entity()
export class UserLimitsCustomEntity extends AbstractEntity {
  @Column('uuid', { nullable: true })
  userId: string;

  @Column('enum', { enum: LEVEL, default: LEVEL.beginner })
  level: LEVEL;

  @Column('integer', { nullable: true, default: 0 })
  withdrawalLimit: number;

  @Column('integer', { nullable: true, default: 0 })
  depositLimit: number;

  @Column('integer', { nullable: true, default: 0 })
  transferLimit: number;
}
