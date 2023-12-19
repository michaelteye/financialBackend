import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../main/entities/user.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';

import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
import { PlATFORM } from '../../main/entities/enums/platform.enum';

@Entity()
export class VasTransactionEntity {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  payload!: any;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  response!: any;

  @OneToMany(() => UserEntity, (user) => user.vas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable: false })
  userId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  amount?: number;

  @Column('text', { nullable: false })
  transactionType: string;

  @Column('enum', {
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PENDING,
  })
 status: TRANSACTION_STATUS;

 @Column('text',{})
 transactionId: string;


  @Column('enum', {
    enum: PlATFORM,
    default: PlATFORM.web,
  })
  platform: PlATFORM;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
