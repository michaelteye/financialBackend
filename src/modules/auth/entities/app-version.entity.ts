import { OmitType } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VerificationType } from '../../enums/verification-type.enum';
import { AbstractEntity } from '../../main/entities/abstract-entity';
import { OTP_STATUS } from './enums/otp-status.enum';


@Entity()
export class AppVersionEntity extends OmitType(AbstractEntity, ['id']) {

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  version: string;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
