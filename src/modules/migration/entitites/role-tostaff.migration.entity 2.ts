import { AbstractEntity } from '../../main/entities/abstract-entity';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MigrateRoleToStaffEntity extends AbstractEntity {

  @Column('text', { nullable: true })
  user_id?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  data!: any;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  error!: any;

  @Column('boolean', { default: false })
  migrated?: boolean;

}
