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
export class AutodeductcheckerEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id?: number;


  @Column("varchar", { nullable: true })
  mandateId: string;

  @Column("varchar", { nullable: true })
  mandateReference: string;

  @Column("text", { nullable: true })
  reference: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
