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

import { VAS_PROVIDERS } from '../enums/providers';
import { BILLER_STATUS } from '../enums/billerStatus';
import { BillerFormFieldsEntity } from './billers_form_fields.entity';

@Entity()
export class BillerEntity {

  
  @PrimaryGeneratedColumn( 'uuid' )
  id: string;


  @Column('text', { nullable: false })
  name?: string;

  @Column('text', { nullable: false })
  description?: string;

  @Column('text', { nullable: true })
  category?: string; //airtime, data, bills
  
  @Column('text', { nullable: false })
  transactionType?: string;

  @Column('text', { nullable: false })
  providerId: string;

  @Column('text', { nullable: true })
  sort: number;  //arrangement of the billers on the frontend

  @Column('text', { nullable: false ,default:BILLER_STATUS.ACTIVE})
  status: BILLER_STATUS;

  // @Column('enum', {
  //   enum: VAS_PROVIDERS,
  // })
  // providerName: VAS_PROVIDERS;



  ///Add Provider Entity, and reference in biller entity
  // Add transaction type

  @OneToMany(() => BillerFormFieldsEntity, (u) => u.biller, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  billerFormField?: BillerFormFieldsEntity[]; 

  @Column("text", { nullable: true })
  imageIcon: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
