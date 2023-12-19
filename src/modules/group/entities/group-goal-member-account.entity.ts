import { AbstractEntity } from '../../main/entities/abstract-entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { GroupGoalMemberEntity } from './group-goal-member.entity';
import { GroupSavingsGoalsEntity } from './group-savings-goal.entity';

@Entity()
export class GroupGoalMemberAccountEntity extends AbstractEntity {
  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  totalSavings: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: false })
  totalWithdrawals: number;

  @Column('int')
  accountNumber: number;

  @Column('uuid')
  savingsGoalId: string;

  @OneToOne(() => GroupGoalMemberEntity, (gm) => gm.account, {
    nullable: false,
  })
  member: GroupGoalMemberEntity;

  @ManyToOne(() => GroupSavingsGoalsEntity, { nullable: false })
  @JoinColumn({ name: 'savingsGoalId' })
  savingsGoal: GroupSavingsGoalsEntity;
}
