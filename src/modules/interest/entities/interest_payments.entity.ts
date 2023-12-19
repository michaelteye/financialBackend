import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';

  // - accountId  :   Account Number
  // - amount : amount
  // - transaction_type : DEBIT, CREDIT
  // - transactionId : Transaction ID to be generated and passed to the payment gateway
  // - narration - Transaction Description (Description should show what transaction is done)
  // - user_id  - Account Holder's ID
  // - phoneNumber  :  mobileNumber that did transaction
  // - platform (web, ussd,  mobile app - )
  
  @Entity()
  export class  InterestPaymentsEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id?: number;
  
  
    @Column('uuid')
    userId: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        nullable: true,
      })
      amount?: number;
  
  
    @Column('text', { nullable: true })
    phone?: string;
  

    @Column('text', { nullable: true })
    narration: string;  //interest payments for April
  

    @Column('uuid', { nullable: true })
    accountId: string;
  

    @CreateDateColumn()
    createdAt?: Date;
  
    @UpdateDateColumn()
    updatedAt?: Date;
  }
  