import { Logger, All, Body, Controller, Post, UseFilters } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { ThrottleExceptionFilter } from '../../../exceptions/throttle.exception';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Transactions')
@Controller('transactions')
export class CallBackController {
  private readonly logger = new Logger('Callback Services');
  constructor(private service: TransactionService) {}

  @UseFilters(new ThrottleExceptionFilter())
  @Throttle(2, 60)
  @All('callback')
  @ApiResponse({
    status: 201,
  })
  async callBack(@Body() request: any): Promise<any> {
    this.logger.debug('callBack', JSON.stringify(request, null, 2));
    console.log("starting callbacking")
    return await this.service.transactionCallback(request);
  }



  @All('callback/paystack')
  @ApiResponse({
    status: 201,
  })
  async callBackPayStack(@Body() request: any): Promise<any> {
    this.logger.debug('callBack', JSON.stringify(request, null, 2));
    console.log("starting callbacking Paystack")
    return await this.service.transactionCallbackPayStack(request);
  }

  @All('autodeduct-callback')
  @ApiResponse({
    status: 201,
  })
  async autoDeductCallback(@Body() request: any): Promise<any> {
    this.logger.debug('callBack Autodeduct', JSON.stringify(request, null, 2));
    return await this.service.transactionAutoDeductCallback(request);
  }

  @All('mandatecreation-callback')
  @ApiResponse({
    status: 201,
  })
  async mandateCreationCallback(@Body() request: any): Promise<any> {
    this.logger.debug('callBack Autodeduct', JSON.stringify(request, null, 2));
    return await this.service.mandateCreateCallback(request);
  }
}
