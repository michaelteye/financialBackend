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
import { AccountStatus } from '../enums/account-status.enum';

@Entity()
export class AdminUserEntity  {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  fullName?: string;
 
  @Column('text', { nullable: true })
  password: string;

  @Column( { nullable: true ,length:200})
  email: string;
 
  @Column(  { nullable: true,length:20 })
  phone: string;

  @Column('enum', { enum: AccountStatus, default: AccountStatus.active })
  accountStatus?: AccountStatus;
 
}
