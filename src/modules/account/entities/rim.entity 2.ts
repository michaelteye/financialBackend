import { AbstractEntity } from '../../main/entities/abstract-entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import Decimal from 'decimal.js';


@Entity()
export class RimEntity extends AbstractEntity {
   

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  totalAccountsBalance?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  totalSavingsGoalBalance?: number;

  @Column('uuid')
  userId: string;
 
}
