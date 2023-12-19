import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
import { NETWORK } from './enums/network.enum';
import { STATUS } from '../../auth/entities/enums/status.enum';
@Entity()
export class AutoDebitEntity extends AbstractEntity {
 

  @OneToOne(() => UserEntity, (user) => user.referrals, { onDelete: 'CASCADE'})
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable:false})
  userId: string;


  @Column('enum', { enum: NETWORK, nullable: true })
  network?: NETWORK;

  @Column('enum', { enum: STATUS, default: STATUS.disabled })
  status: STATUS;

  @Column({ nullable: true, length: 20 })
  phoneNumber?: string;


  @Column("text", { nullable: true,default:0 })
  count: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;




}
//ref, createdAt, updatedAt

