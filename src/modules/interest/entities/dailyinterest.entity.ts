import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { INTEREST_STATUS_TYPE } from '../enums/interest-status.enum';

  // - accountId  :   Account Number
  // - amount : amount
  // - transaction_type : DEBIT, CREDIT
  // - transactionId : Transaction ID to be generated and passed to the payment gateway
  // - narration - Transaction Description (Description should show what transaction is done)
  // - user_id  - Account Holder's ID
  // - phoneNumber  :  mobileNumber that did transaction
  // - platform (web, ussd,  mobile app - )
  
  @Entity()
  export class  DailyInterestPaymentEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id?: number;
  
  
    @Column('uuid')
    userId: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 5,
        default: 0,
        nullable: true,
      })
      amount?: number;
  
  
    @Column('text', { nullable: true })
    phone?: string;
  

    @Column('text', { nullable: true })
    narration: string;

    @Column('text', { nullable: false })
    name: string;
  

    @Column('uuid', { nullable: true })
    accountId: string;
  

    @Column('enum', {enum:INTEREST_STATUS_TYPE })
    paymentStatus: INTEREST_STATUS_TYPE; // enum : COMPLETED, PENDING

    
    @Column('text', {default: null})
    paymentDate?: Date; //NULL, WHEN YOU PAY SET THE DATE OF PAYMENT

    @CreateDateColumn()
    createdAt?: Date;
  
    @UpdateDateColumn()
    updatedAt?: Date;
  }
  