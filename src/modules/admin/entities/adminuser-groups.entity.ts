import { UserEntity } from '../../main/entities/user.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';


@Entity()
export class AdminUserGroupsEntity  {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column('uuid', { nullable: true })
  groupId?: string;
}
