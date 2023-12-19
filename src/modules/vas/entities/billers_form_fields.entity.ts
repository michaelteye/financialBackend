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
 
import { BillerEntity } from './biller.entity';
import { FORM_FIELD_TYPES } from '../enums/formFields';
  
  @Entity()
  export class BillerFormFieldsEntity {

    @PrimaryGeneratedColumn( 'uuid' )
    id: string;
  
  
    @Column('text', { nullable: false })
    fieldName?: string;
  

    @Column('text', { nullable: false })
    fieldLabel?: string;
  
    @Column('enum', {
      enum: FORM_FIELD_TYPES,
    })
    fieldType: FORM_FIELD_TYPES;

    @Column({
      type: 'jsonb',
      nullable: true,
      default: {},
    })
    selectOptions: [];

    @ManyToOne(() => BillerEntity, (u) => u.billerFormField)
    @JoinColumn({ name: 'billerId' })
    biller: BillerEntity;
  
    @Column('uuid')
    billerId: string;
   
  
    @CreateDateColumn()
    createdAt?: Date;
  
    @UpdateDateColumn()
    updatedAt?: Date;
  }
  

 