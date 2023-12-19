import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
import { ReferralEntity } from './referral.entity';

@Entity()
export class ReferredUserEntity {

    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id?: number;


  @OneToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable: false })
  userId: string;


  @ManyToMany(()=> ReferralEntity, (user)=> user.id)
  @JoinColumn({name: 'referrerId'})
  referrer: ReferralEntity;

  @Column('uuid', { nullable: false })
  referrerId: string;




  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
//ref, createdAt, updatedAt

