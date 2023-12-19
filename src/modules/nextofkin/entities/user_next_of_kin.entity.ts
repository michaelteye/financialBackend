import {
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
  } from 'typeorm';
  import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
  import { UserPinEntity } from '../../userpin/entities/userpin.entity';
  import { AccountEntity } from '../../account/entities/account.entity';
  import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
  import { ReferralEntity } from '../../referrals/entities/referral.entity';
  import { FileEntity } from '../../fileupload/entities/file.entity';
  import { SOCIAL } from '../../enums/social.enum';
  import { InvestmentEntity } from '../../investment/entities/invest.entity';
  import { PinVerificationEntity } from '../../userpin/entities/pin-verification.entity';
  import { LEVEL } from '../../auth/entities/enums/level.enum';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';
  
  @Entity()
  export class UserNextOfKinEntity extends AbstractEntity {
    @Column('text', { nullable: true })
    user_id?: string;

    @OneToOne(() => UserEntity, (user) => user.nextofkin)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column('uuid', {nullable:false})
    userId:string;
  
    @Column('text', { nullable: true })
    firstName?: string;
  
    @Column('text', { nullable: true })
    lastName?: string;
  
    @Column('text', { nullable: true, unique: true })
    relationship?: string;
  
    @Column('text', { nullable: true })
    country?: string;
  
    @Column('text', { nullable: true })
    region?: string;
  
    @Column('date', { nullable: true })
    dateOfBirth?: Date;
  
    @Column({ nullable: true, length: 10 })
    gender: string;

    @Column(  { nullable: true,length:20 })
    phone: string;
  
    @Column('text', { nullable: true })
    occupation?: string;

    @Column('text', { nullable: true })
    homeAddress?: string;

    @Column('text', { nullable: true })
    gpsAddress?: string;

    // @OneToOne(() => UserEntity, (user) => user.id)
    // @JoinColumn({ name: 'userId' })
    // userId: UserEntity;
  }
  
  
  