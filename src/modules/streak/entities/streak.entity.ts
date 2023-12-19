import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { UserEntity } from '../../main/entities/user.entity';
//   import { TRANSACTION_STATUS } from '../../enums/transaction.status';
  import { PlATFORM } from '../../main/entities/enums/platform.enum';
  import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
  import { OmitType } from '@nestjs/swagger';
  import { AccountEntity } from '../../account/entities/account.entity';
  

  
  @Entity()
  export class StreakEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id?: number;

  
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
  
    @Column('uuid')
    userId: string;
    ////


    //Todo Remove the relationship here so that streak can work
    @ManyToMany(() => TransactionEntity,(a) => a.transactionId)
    @JoinColumn({ name: 'transactionId' })
    transaction: TransactionEntity;

    @Column('text')
    transactionId: string;

    @Column()
    datedon: Date;

  
    @ManyToOne(() => AccountEntity, (a) => a.transactions)
    @JoinColumn({ name: 'accountId' })
    account: AccountEntity;
  
    @Column('uuid', { nullable: true })
    accountId: string;

    @Column('boolean', { default: false })
    isstreak: boolean;

  
    @CreateDateColumn()
    createdAt?: Date;
  
    @UpdateDateColumn()
    updatedAt?: Date;
  }
  