import { Injectable } from '@nestjs/common';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { EntityManager } from 'typeorm';
import { HttpRequestService } from '../../shared/services/http.request.service';
import { FEE_TYPE } from '../../enums/fee-type.enum';
import { FeesEntity } from '../entities/fees.entity';
import { FEE_FORMAT } from '../../enums/fee-format.enum';
import Decimal from 'decimal.js';
import { TransferCoreDto } from '../dto/TransferCoreDto';
import { AccountService } from '../../account/services/account.service';
import { SYSTEM_ACCOUNT } from './systemaccts.constants';
import { InjectEntityManager } from '@nestjs/typeorm';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { from } from 'rxjs';
import { AccountEntity } from '../../account/entities/account.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { format, format as formatDate, isAfter, isBefore, isEqual,parseISO } from 'date-fns';


@Injectable()
export class FeeService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private accountService: AccountService
  ) {
    // super();
  }

   private async getFees(feeType: FEE_TYPE, amount: number): Promise<number> {
    const feeData = await this.em.findOne(FeesEntity, {
      where: { feeType: feeType },
    });
    console.log("feeData FOUND >>", feeData)
    if (feeData) {
      if (feeData.feeFormat == FEE_FORMAT.PERCENTAGE) {
        let trxnAmnt = new Decimal(amount);
        let feePerc = new Decimal(feeData.value).dividedBy(100);
        let fee = trxnAmnt.times(feePerc);
        const calculation = Number(trxnAmnt) * (feeData.value / 100)
        console.log("calculation", calculation)
        return Number(calculation.toFixed(2))
       } else if (feeData.feeFormat == FEE_FORMAT.FIXED_VALUE) {
        let feeVal = new Decimal(feeData.value);
        return Number(feeVal.toFixed(2))
      }
    }
    return 0;
  }

  private async getBezoLockFees( amount: number,accountId:string): Promise<number> {
      let savingsGoal = await this.em.findOne(SavingsGoalEntity, {where:{accountId:accountId}}); 
      const now = new Date();
      console.log('The savings goal endDate>>',savingsGoal.endDate);
      console.log('The savings goal startDate>>',savingsGoal.startDate);
      console.log('The savings startDate type>>',typeof savingsGoal.startDate);
      console.log('The savings endDate type>>',typeof savingsGoal.endDate);
      let startDateTime ;
      let endDateTime;
      if(typeof savingsGoal.startDate =='string'){
        startDateTime = parseISO(savingsGoal.startDate).getTime()
      }else{
        startDateTime = savingsGoal.startDate.getTime();
      }
      if(typeof savingsGoal.endDate =='string'){
        endDateTime = parseISO(savingsGoal.endDate).getTime()
      }else{
        endDateTime = savingsGoal.endDate.getTime();
      }
      console.log('The dates were parseIso startDateTime',startDateTime)
      console.log('The dates were parseIso endDateTime',endDateTime)
      const totalDuration = endDateTime - startDateTime;
      const elapsedDuration = now.getTime() - startDateTime;
      const timeUntilEndDate = endDateTime - now.getTime();
      let feePercentage: number;
      console.log('Elabpsed duration >>',elapsedDuration);
      console.log('Elabpsed timeUntilEndDate >>',timeUntilEndDate);
      if (elapsedDuration <= 0) {
        // The start date is today or in the past
        feePercentage = 10;
      } else if (timeUntilEndDate <= 0) {
        // The end date has passed
        feePercentage = 5;
      } else {
        // Calculate the fee percentage on a linear scale from 10% to 5%
        feePercentage = 10 - (5 * elapsedDuration) / totalDuration;
      }

      // if(savingsGoal.endDate){}

   

// // Parse the date you want to check (assuming it's in ISO 8601 format)
// const dateToCheck = parseISO(savingsGoal.endDate+'');

// // Compare the two dates
// const isGreaterThanCurrentDate = isAfter(dateToCheck, now);
// console.log("isGreaterThanCurrentDate",isGreaterThanCurrentDate)

      const feeAmount = amount * (feePercentage / 100);
      console.log('The bezoLock feePercentage >>'+feePercentage);
      console.log('The bezoLock eeAmount >>'+feeAmount);
      return feeAmount
  }

  async buildFeeTransfer(feeType: FEE_TYPE, tranferPayload: TransferCoreDto): Promise<TransferCoreDto> {
    let fromAccounTypes = await this.em.query(`select at.*  from account_type_entity at 
    inner join account_entity a on a."accountTypeId"=at.id
    where a.id='${tranferPayload.fromAccountId}'`) as  AccountTypeEntity[];
    let fromAccountType = fromAccounTypes[0];
    let fee =0;
    if(fromAccountType.alias=='bezo-lock'){
      fee = await this.getBezoLockFees(tranferPayload.amount,tranferPayload.fromAccountId);
    }else{
      fee = await this.getFees(feeType, tranferPayload.amount);
    }
    let feeTransfer = new TransferCoreDto();
    feeTransfer.fromAccountId = tranferPayload.fromAccountId;
    feeTransfer.toAccountId = (await this.accountService.getAccountbyType(SYSTEM_ACCOUNT.EARLY_WITHDRAWAL_FEES)).id;
    feeTransfer.amount = fee;
    feeTransfer.toAccountNarration = "Early withdrawal fees";
    feeTransfer.fromAccountNarration = "Early withdrawal fees";
    feeTransfer.reference = tranferPayload.reference;
    return feeTransfer;
  }

  
}