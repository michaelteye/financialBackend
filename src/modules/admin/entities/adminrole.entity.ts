import { UserEntity } from '../../main/entities/user.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntityType } from '../enums/role.entity-type.enum';


@Entity()
export class AdminRoleEntity  {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column('uuid', { nullable: true })
  entityId?: string; //userId or groupId

  @Column('uuid', { nullable: true })
  joinType?: RoleEntityType;

  @Column('text', { nullable: true })
  roleName?: string;
}
