import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';


import { INTEREST_TYPE } from '../enums/interest-type.enum';
import { INTEREST_FORMAT } from '../enums/interest-format.enum';


@Entity()
export class InterestEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id?: number;

    @Column('enum', {
        enum: INTEREST_TYPE,
       // default: FEE_TYPE.EARLY_WITHDRAWAL,
    })
    interestType: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        nullable: true,
    })
    value: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        nullable: true,
    })
    thresholdStartPoint: number; //1000 

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        nullable: true,
    })
    threshHoldValue: number;

    @Column('enum', {
        enum: INTEREST_FORMAT,
        default: INTEREST_FORMAT.PERCENTAGE,
    })
    feeFormat: INTEREST_FORMAT;

    @Column('enum', {
        enum: INTEREST_FORMAT,
        default: INTEREST_FORMAT.PERCENTAGE,
    })
    threshHoldFormat: INTEREST_FORMAT;
}
