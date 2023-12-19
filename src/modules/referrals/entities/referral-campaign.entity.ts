import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';

@Entity()
export class ReferralCampaignEntity extends AbstractEntity {

  @Column('boolean', {
   
    default: false
  })
  status: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

}


