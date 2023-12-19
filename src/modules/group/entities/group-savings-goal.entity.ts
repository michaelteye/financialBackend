import { GroupEntity } from './group.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { GoalNature, PaticipationTypes } from '../types/group-savings-goal';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { GroupMemberEntity } from './group-member.entity';
import { GroupGoalMemberEntity } from './group-goal-member.entity';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { GoalTypeEntity } from '../../savings-goal/entities/goal-type.entity';

@Entity()
export class GroupSavingsGoalsEntity extends AbstractEntity {
  @Column('uuid')
  accountId: string; /// account to be created when creating a group savings goal

  @Column('uuid')
  groupId: string;


  @ManyToOne(() => GoalTypeEntity, (u) => u.savingsGoals)
  @JoinColumn({ name: 'goalTypeId' })
  goalType?: GoalTypeEntity;

  @Column('uuid')
  goalTypeId?: string;

  @Column('varchar', { nullable: true, length: 100 })
  refNo?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountToSave: number;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('integer', { default: 0, nullable: false })
  period: number;

  @Column('boolean')
  lockSaving: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountToRaise: number;

  @Column('enum', { enum: GOAL_STATUS } )
  goalStatus: GOAL_STATUS | string

  @Column('boolean', { default: false })
  isFavorite: boolean;
  

  @Column('date', { nullable: false })
  startDate: Date;

  @Column('date', { nullable: false })
  endDate?: Date;

  @Column('text')
  emoji: string;


  @Column('enum', {
    enum: DEPOSIT_PREFERENCE,
    nullable: true,
  })
  preference?: DEPOSIT_PREFERENCE;

  @Column('uuid', { nullable: true })
  autoDeductPaymentMethodId?: string;

  @Column('uuid')
  creatorId: string;  /// admin's id

  @Column('enum', { enum: FREQUENCY_TYPE })
  frequency: FREQUENCY_TYPE;

  // @Column('enum', { enum: PaticipationTypes, nullable: false })
  // participationType: PaticipationTypes;

  // @Column('enum', { enum: GoalNature, nullable: false })
  // nature: GoalNature;

  @OneToOne(() => AccountEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'accountId' })
  account: AccountEntity;

  @ManyToOne(() => GroupEntity, (g) => g.savingsGoals, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  group: GroupEntity;

  @ManyToOne(() => GroupMemberEntity, { nullable: false })
  @JoinColumn({ name: 'creatorId' })
  creator: GroupMemberEntity;

  @OneToMany(() => GroupGoalMemberEntity, (gm) => gm.savingsGoal)
  members: GroupGoalMemberEntity[];
}
