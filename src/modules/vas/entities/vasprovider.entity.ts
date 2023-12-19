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


  @Entity()
  export class VasProviderEntity {
  
    @PrimaryGeneratedColumn( 'uuid' )
    id: string;
  
    @Column('text', { nullable: false })
    name?: string;
  
    @Column('text', { nullable: true })
    description?: string;

    @Column('text', { nullable: false })
    accountId: string;


    @CreateDateColumn()
    createdAt?: Date;
  
    @UpdateDateColumn()
    updatedAt?: Date;
  }
  