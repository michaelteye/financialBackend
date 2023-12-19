import { GroupSavingsGoalsEntity } from './group-savings-goal.entity';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GroupMemberEntity } from './group-member.entity';
import { OmitType } from '@nestjs/swagger';

@Entity()
export class GroupEntity extends AbstractEntity {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column('uuid', {nullable: true})
  userId: string; /// creator id

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('uuid', { nullable: true })
  accountId: string;

  // @Column('uuid', { nullable: false })
  // groupTypeId: string;

  // @Column('uuid')
  // creatorId: string;




  @OneToMany(() => GroupMemberEntity, (gm) => gm.group, { nullable: true })
  members: GroupMemberEntity[];

  @OneToMany(() => GroupSavingsGoalsEntity, (gs) => gs.group, { nullable: true })
  savingsGoals: GroupSavingsGoalsEntity[];
}

export class GroupsDto extends OmitType(GroupEntity, ['id']) {}