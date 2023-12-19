import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { AbstractEntity } from './abstract-entity';
import { AddressEntity } from './address.entity';
import { PlatformEntity } from './platform.entity';
import { UserPinEntity } from '../../userpin/entities/userpin.entity';
import { PaymentMethodEntity } from './paymentmethod.entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { SavingsGoalEntity } from '../../../../src/modules/savings-goal/entities/savings-goal.entity';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
import { FileEntity } from '../../fileupload/entities/file.entity';
import { DeviceEntity } from './device.entity';
import { SOCIAL } from '../../enums/social.enum';
import { InvestmentEntity } from '../../investment/entities/invest.entity';
import { PinVerificationEntity } from '../../userpin/entities/pin-verification.entity';
import { LEVEL } from '../../../../src/modules/auth/entities/enums/level.enum';
import { UserNextOfKinEntity } from '../../nextofkin/entities/user_next_of_kin.entity';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { SurveyEntity } from '../../survey/entity/survey.entity';
import { VasTransactionEntity } from '../../vas/entities/vas.entity';

@Entity()
export class UserEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  user_id?: string;

  // @Column('uuid')
  // user_id: string;

  @Column('text', { nullable: true })
  firstName?: string;

  @Column('text', { nullable: true })
  lastName?: string;

  @Column('text', { nullable: true })
  otherName?: string;

  @Column('text', { nullable: true, unique: true })
  userName?: string;
  // @Column('text', { nullable: true })
  // userName?: string;

  @Column('text', { nullable: true })
  referralCode?: string;

  @Column('text', { nullable: true })
  deviceId?: string;

  @Column('text', { nullable: true })
  country?: string;

  @Column('text', { nullable: true })
  region?: string;

  // @Column('text', { nullable: true })
  // nextofking?: string;

  @Column('date', { nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true, length: 10 })
  gender: string;

  @Column({
    name: 'social',
    type: 'enum',
    enum: SOCIAL,
    enumName: 'social',
    nullable: true,
  })
  bezoSource: SOCIAL;

  @Column('text', { nullable: true })
  occupation?: string;

  @OneToOne(() => AuthUserEntity, (auth) => auth.user)
  authUser: AuthUserEntity;

  @Column('enum', { enum: LEVEL, default: LEVEL.beginner })
  level?: LEVEL;    //this will just bloat the database it has just one column which can come to this table

  @OneToOne(() => AddressEntity, (a) => a.user, {
    cascade: true,
  })
  address?: AddressEntity;

  @OneToOne(() => UserPinEntity, (t) => t.user, { cascade: true })
  pin?: UserPinEntity;

  @OneToMany(() => FileEntity, (u) => u.user, {
    cascade: true,
  })
  files?: FileEntity[];

  @OneToMany(() => PaymentMethodEntity, (u) => u.user, { cascade: true })
  userPaymentMethods?: PaymentMethodEntity[];

  @OneToMany(() => PlatformEntity, (p) => p.user, { cascade: true })
  platforms?: PlatformEntity[];

  @OneToMany(() => AccountEntity, (u) => u.user, { cascade: true })
  accounts: AccountEntity[];

  @OneToMany(() => NotificationEntity, (u)=> u.user, {cascade: true})
  notification: NotificationEntity[]

  @OneToMany(() => SavingsGoalEntity, (u) => u.user, { cascade: true })
  savingsGoals: SavingsGoalEntity[];

  // @OneToMany(() => SavingsGoalEntity, (u) => u.user, { cascade: true })
  // savingsGoals: SavingsGoalEntity[];

  @OneToMany(() => ReferralEntity, (u) => u.user)
  referrals: ReferralEntity[];

  @OneToMany(() => VasTransactionEntity, (u) => u.user)
  vas: VasTransactionEntity[];


  @OneToMany(() => UserNextOfKinEntity, (u) => u.user)
  nextofkin: UserNextOfKinEntity[];

  @OneToMany(() => SurveyEntity, (u) => u.user)
  survey: SurveyEntity[];

  @OneToMany(() => DeviceEntity, (d) => d.user, {
    cascade: true,
  })
  devices?: DeviceEntity[];

  @Column('boolean', { nullable: true, default: false })
  agreeToTerms?: boolean;


  @OneToMany(() => InvestmentEntity, (i) => i.user, {
    cascade: true,
  })
  investments?: InvestmentEntity[]; 


  @OneToMany(() => PinVerificationEntity, (p) => p.user)
  pinVerifications?: PinVerificationEntity[];
}


