import { LEVEL } from '../../auth/entities/enums/level.enum';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from './abstract-entity';

@Entity()
export class UserLevelEntity extends AbstractEntity {
 @Column('enum', { enum: LEVEL, default: LEVEL.beginner })
  level: LEVEL; //

  @Column('integer', { nullable: true, default: 0 })
  withdrawalLimit: number;
  
  @Column('integer', { nullable: true, default: 0 })
  depositLimit: number;

  @Column('integer', { nullable: true, default: 0 })
  transferLimit: number;
}
