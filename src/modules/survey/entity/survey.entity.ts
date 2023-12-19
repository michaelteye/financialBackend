import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { UserEntity } from '../../main/entities/user.entity';

@Entity()
export class SurveyEntity extends AbstractEntity {
  @Column('text', { nullable: false })
  message: string;

  @OneToOne(() => UserEntity, (user) => user.survey, { onDelete: 'CASCADE'})
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid', { nullable:false})
  userId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
    })
    rating: number;

  @Column('text', { nullable:true})
  additional_info: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}