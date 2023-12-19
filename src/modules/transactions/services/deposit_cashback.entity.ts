import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';

@Entity()
export class DepositCashbackEntity extends AbstractEntity {


  @OneToOne(() => UserEntity, (user) => user.referrals, { onDelete: 'CASCADE'})
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable:false})
  userId: string;


  @Column('uuid', { nullable:false})
  accountId: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

}


