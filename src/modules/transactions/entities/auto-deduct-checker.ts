import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../main/entities/user.entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { MandateStatus } from '../../enums/mandate.status.enum';
import { FrequencyTypes } from '../../enums/frequency-types.enum';
import { MandateCategory } from '../../enums/mandate.category.enum';


@Entity()
export class AutoDeductCheckerEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id?: number;

  @Column('uuid')
  userId: string;


  @Column("varchar", { nullable: false })
  mandateId: string;

  @Column("text", { nullable: false })
  reference: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
