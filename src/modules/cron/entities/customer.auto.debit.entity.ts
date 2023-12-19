import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class CustomerAutoDebitEntity extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  phone: string;

  @Column({default: 0})
  count: number;

  @Column({default: 'INPROGRESS'})
  status: string;

  @Column({default: new Date()})
  createdAt: Date;

  @Column({default: new Date()})
  updatedAt: Date;
}