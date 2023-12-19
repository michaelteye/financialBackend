import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Equal } from 'typeorm'
// import { SavingsGoalEntity } from "src/modules/savings-goal/entities/savings-goal.entity";
import { SavingsGoalEntity } from "src/modules/savings-goal/entities/savings-goal.entity";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Injectable, Logger } from "@nestjs/common";
import { Module } from "@nestjs/common";
// import { InjectSchedule, Schedule, Timeout} from "nest-schedule";
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { isBefore, isEqual, subMonths, intervalToDuration, parseISO, format, differenceInDays } from 'date-fns';
import { AccountEntity } from "src/modules/account/entities/account.entity";
import { NotificationService } from "../../notifications/services/notification.service"
// import {Injectable} from '@nestjs/common'
import { AuthUserEntity } from "src/modules/auth/entities/auth-user.entity";
import { LessThanOrEqual, LessThan } from 'typeorm';
import { number } from "joi";
import { NOTIFICATIONS } from "src/modules/enums/notification.providers";
import { AccountService } from "src/modules/account/services/account.service";
import { TransactionService } from "src/modules/transactions/services/transaction.service";
import { DepositDto } from "src/modules/ussdapi/dtos/deposit.dto";
import { NETWORK } from "src/modules/main/entities/enums/network.enum";
import { DepositInputDto } from '../dtos/debit.dto';
import { PlATFORM } from "src/modules/main/entities/enums/platform.enum";
import { UserPinService } from "src/modules/userpin/services/userpin.service";
import { gen } from 'n-digit-token';
import { deprecate } from "util";
import { TRANSACTION_TYPE } from "src/modules/enums/transaction-type.enum";
import { TransactionEntity } from "src/modules/transactions/entities/transaction.entity";
import { TRANSACTION_STATUS } from "src/modules/enums/transaction.status";
import { CustomerAutoDebitEntity } from "../entities/customer.auto.debit.entity";
import { CRON_STATUS } from "../constants/cron.status";
import { uuid } from "uuidv4";
import { InterestPaymentService } from "src/modules/interest/services/interest-payment.service";



Injectable()
export class InterestPaymentCronService {
    private readonly logger = new Logger('CronService')
    constructor(

        @InjectEntityManager('default') private em: EntityManager,
        // @InjectRepository(SavingsGoalEntity)
        // private savingGoalRepository: Repository<SavingsGoalEntity>,
        // private accountGoalRepository: Repository<AccountEntity>,
        // @InjectSchedule() private readonly schedule: Schedule
        private interestPaymentService: InterestPaymentService,
    ) { }



    /**
     * 
     * TODO Write comments on each of the functions
     */
     @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async payInterestForBezoFlexUsers() { //1% per anum
        this.logger.log('------- DAILY INTEREST PAYMENT FOR BEZO FLEX USERS ---------');
        this.interestPaymentService.dailyInterestCalBezoFlexUsers()  //todo when selecting add a condition to select flex after Feb 2023
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async payInterestForBezoLockUsers() { //9% per anum
        this.logger.log('------- DAILY INTEREST PAYMENT FOR BEZO LOCK USERS ---------');
        this.interestPaymentService.dailyInterestCalcForBezoLockUsers()
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async payFlexUsersCreatedBeforeFebruary() { //9% per anum
        this.logger.log('------- DAILY INTEREST PAYMENT FOR SAVINGS GOAL CREATED BEFORE FEBRUARY ---------');
        this.interestPaymentService.dailyInetrestCalckForBezoFlexUsersCreatedBeforeFebruary()
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async payInterestAtTheEndofTheMonth() { //
        this.logger.log('------- PAYMENT OF MONTHLY INTEREST (SUMING ALL USER INTEREST) ---------');
        this.interestPaymentService.payInterestForMonthEnd()
    }


}