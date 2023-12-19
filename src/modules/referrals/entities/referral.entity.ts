import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';

@Entity()
export class ReferralEntity extends AbstractEntity {
  @Column('text', { nullable: false })
  code: string;

  @OneToOne(() => UserEntity, (user) => user.referrals, { onDelete: 'CASCADE'})
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable:false})
  userId: string;

  @Column('text', { nullable:true})
  ref_id: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

}


