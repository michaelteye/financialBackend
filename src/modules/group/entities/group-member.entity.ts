import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { GROUP_MEMBERS_STATUS } from '../enums/group-members-status';
import { GroupMemberRole } from '../enums/group-member';
import { GroupEntity } from './group.entity';

@Entity()
export class GroupMemberEntity extends AbstractEntity {
 

  @Column('uuid')
  userId: string;

  @Column('uuid')
  groupId: string;



  @Column('enum', {
    enum: GroupMemberRole,
    default: GroupMemberRole.CONTRIBUTOR,

  })
  role: GroupMemberRole

  @Column('enum', { enum: GROUP_MEMBERS_STATUS, default: GROUP_MEMBERS_STATUS.PENDING })
  status: GROUP_MEMBERS_STATUS;


  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => GroupEntity, (g) => g.members, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  group: GroupEntity;
}
