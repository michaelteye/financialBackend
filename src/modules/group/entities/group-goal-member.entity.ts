import { GroupGoalMemberAccountEntity } from './group-goal-member-account.entity';
import { AbstractEntity } from './../../main/entities/abstract-entity';
import { GroupSavingsGoalsEntity } from './group-savings-goal.entity';
import { UserEntity } from '../../main/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity()
export class GroupGoalMemberEntity extends AbstractEntity {
  @Column('uuid')
  userId: string;

  @Column('uuid')
  groupSavingsGoalId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => GroupSavingsGoalsEntity, (g) => g.members, {
    nullable: false,
  })
  @JoinColumn({ name: 'savingsGoalId' })
  savingsGoal: GroupSavingsGoalsEntity;

  @Column('uuid')
  accountId: string;


  @Column('uuid')
  groupId: string;

  // @OneToOne(() => GroupGoalMemberAccountEntity, (ggm) => ggm.member, {
  //   nullable: false,
  // })
  @JoinColumn({ name: 'accountId' })
  account: GroupGoalMemberAccountEntity;
}
