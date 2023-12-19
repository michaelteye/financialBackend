import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { FEE_FORMAT } from '../../enums/fee-format.enum';
import { FEE_TYPE } from '../../enums/fee-type.enum';


@Entity()
export class FeesEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id?: number;

    @Column('enum', {
        enum: FEE_TYPE,
        default: FEE_TYPE.EARLY_WITHDRAWAL,
    })
    feeType: string;

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
        enum: FEE_FORMAT,
        default: FEE_FORMAT.PERCENTAGE,
    })
    feeFormat: FEE_FORMAT;

    @Column('enum', {
        enum: FEE_FORMAT,
        default: FEE_FORMAT.PERCENTAGE,
    })
    threshHoldFormat: FEE_FORMAT;
}
