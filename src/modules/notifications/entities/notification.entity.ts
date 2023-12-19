import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';



@Entity()
export class NotificationEntity extends AbstractEntity{

  @ManyToOne(() => UserEntity, (a) => a.notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column('uuid')
  userId: string;

  @Column('text', { nullable: true })
  title: string;

  @Column('text', { nullable: true })
  type: string;

  @Column('text',{ nullable: true})
  message: string;

  @Column('boolean',{default:false})
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;

}

