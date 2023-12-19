import { UserEntity } from '../../main/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class AdminRoleTypeEntity  {

  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column('text', { nullable: true })
  roleName?: string; // CanDeleteUser, CanViewTransactions, CanUpgradeUser, CanCreditUser

  @Column('text', { nullable: true })
  description?: string; // CanDeleteUser, CanViewTransactions, CanUpgradeUser, CanCreditUser
 
}
