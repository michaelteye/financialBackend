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


@Entity()
export class MandateEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  amount?: number;

  // @ManyToOne(() => UserEntity)
  // @JoinColumn({ name: 'userId' })
  // user: UserEntity;

  @Column('uuid')
  userId: string;

  @OneToOne(() => AccountEntity)
  @JoinColumn({ name: 'accountId' })
  account: AccountEntity;

  @Column("varchar", { nullable: true,unique:true })
  accountId: string;

  @Column("varchar", { nullable: false })
  mandateId: string;

  @Column("date", { nullable: true })
  startDate: Date;

  @Column("date", { nullable: true })
  endDate: Date;

  // @Column("text", { nullable: true })
  // debitDay: string;

  @Column("text", { nullable: true })
  reference: string;

  @Column("text", { nullable: true })
  statusMessage: string;

  @Column("text", { nullable: true })
  phoneNumber: string;

  @Column("enum", { nullable: true, enum: FrequencyTypes })
  frequencyType: FrequencyTypes;

  @Column("text", { nullable: true })
  frequency: string;

  @Column({
    type: 'enum',
    enum: MandateStatus,
    default: MandateStatus.ACTIVE,
    nullable: true,
  })
  status?: MandateStatus;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
