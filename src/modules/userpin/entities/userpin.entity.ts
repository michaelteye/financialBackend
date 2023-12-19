import { STATUS } from '../../auth/entities/enums/status.enum';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';

export enum TransactionStatus {
  active = 'active',
  disabled = 'disabled',
}


/***
 * When a user signs up create a default pin 
 * when the user changes pin set the updated to true
 * 
 * 
 */
@Entity()
export class UserPinEntity extends AbstractEntity {
  @Column('text', { select: false })
  pin: string;

  @Column('text', { default: STATUS.disabled })
  status: STATUS;

  @OneToOne(() => UserEntity, (user) => user.pin)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('bool', { default: false })
  updated?: boolean;

  @Column('text')
  userId: string;
}
