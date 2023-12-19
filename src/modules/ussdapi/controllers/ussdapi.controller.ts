import {
  Controller,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
  Patch,
  Param,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UssdApiService } from '../services/ussdapi.service';
import { CreateSavingsGoalDto, deleteSavingsGoalDto } from '../dtos/create-savingsgoal.dto';
import { GenericResponse } from '../dtos/generic-response';
import { DepositDto } from '../dtos/deposit.dto';
import { WithdrawalDto } from '../dtos/withdraw.dto';
import { WalletDto } from '../dtos/wallet.dto';
import { InjectUssdUserAuthGuard } from '../guards/injectussduser.guard';
import { TransferDto } from '../dtos/transfer.dto';
import { checkRegistrationDto } from '../dtos/check-registration-status.dto';
import { registerInputDto } from '../dtos/register.dto';
import { Delete, Put } from '@nestjs/common/decorators';
import { SavingsGoalDto, SavingsGoalInputEditDto } from '../../savings-goal/dtos/savings-goal.dto';
import { PinResponseDto, UpdateUserPinDto } from '../../userpin/dtos/user-pin.dto';
import {  PinInputDto } from '../dtos/pin.dto';
import { VasDto } from '../dtos/vas.dto';



@ApiTags('UssdApi')
@Controller('ussdapi')
// @UseGuards(InjectUssdUserAuthGuard)
export class UssdController {
  constructor(private service: UssdApiService) { }




  // Create Savings Goal
  @Post('/checkRegistrationStatus')
  @ApiResponse({
    status: 200,
    description: 'Check if user is registered on  bezoSusu.',
    type: GenericResponse,
  })
  async checkUserRegistration(@Body() request: checkRegistrationDto): Promise<GenericResponse> {
    
     const checkUser= await this.service.checkUserRegistrationStatus(request)
     console.log("checkUser test",checkUser)

     if(checkUser && checkUser.accountStatus=='disabled'){
      return {status:"00",message:"User registered"}
     }

     if(checkUser && checkUser.accountStatus=='active' || checkUser && checkUser.accountStatus=='enabled'){
      return {status:"01",message:"User already exist"}
     }

     return {status:"00",message:"User not registered"}
  
    // return (await this.service.createSavingsGoal(request)) as GenericResponse;
  }


  @Post('/signup')
  @ApiResponse({
    status: 200,
    description: 'Check if user is registered on  bezoSusu.',
    type: GenericResponse,
  })
  async registerUser(@Body() request: registerInputDto): Promise<GenericResponse> {
    
     const checkUser= await this.service.signUp(request)
     if(checkUser){
      return {status:"00",message:"User registered"}
     }
     return {status:"01",message:"User registered"}
  
    // return (await this.service.createSavingsGoal(request)) as GenericResponse;
  }

  // Create Savings Goal
  @Post('/createsavingsgoal')
  @ApiResponse({
    status: 200,
    description: 'Savings Goal created successfully.',
    type: GenericResponse,
  })
  @UseGuards(InjectUssdUserAuthGuard)
  async createSavingsGoal(@Body() request: CreateSavingsGoalDto): Promise<GenericResponse> {
    return (await this.service.createSavingsGoal(request)) as GenericResponse;
  }


  @Post('/deletesavinggoal')
  @ApiResponse({
    status: 200,
    description: 'Deleted Saving goal successfully.',
    type: GenericResponse,
  })
  @UseGuards(InjectUssdUserAuthGuard)
  async deleteSavingsGoal(@Body() request: deleteSavingsGoalDto): Promise<GenericResponse> {
    return (await this.service.deleteSavingsGoal(request)) as GenericResponse;
  }


  

  @Get('/goaltypes')
  @ApiResponse({
    status: 200,
    description: "Get savingsgoal types e.g. rent,emergency etc"
  })
  async getGoalTypes(): Promise<any> {
    return (await this.service.getAllGoalTypes()) as Promise<any>;
  }

  @Get('/getBillers')
  @ApiResponse({
    status: 200,
    description: "Get savingsgoal types e.g. rent,emergency etc"
  })
  async getBillers(): Promise<any> {
    return (await this.service.getBillers()) as Promise<any>;
  }

  @Post('/vas/buy')
  @UseGuards(InjectUssdUserAuthGuard)
  async buy(@Body() request: VasDto): Promise<any> {
    return await this.service.buy(
      request
    );
  }


  @Get('/accounttypes')
  @ApiResponse({
    status: 200,
    description: "Get savingsgoal types e.g. rent,emergency etc"
  })
  async getAccountTypes(): Promise<any> {
    return (await this.service.getAccountTypes()) as Promise<any>;
  }

  @Get('/mysavingsgoals')
  @ApiResponse({
    status: 200,
    description: "Get Savings goal of dialing user"
  })
  @UseGuards(InjectUssdUserAuthGuard)
  async mySavingsGoal(): Promise<any> {
    return (await this.service.getAllGoalTypes()) as Promise<any>;
  }


  // @Get('/goals/:id')
  // @ApiParam({ name: 'id', required: true, type: String })
  // @ApiResponse({
  //   status: 200,
  //   description: "Get Savings goal of dialing user"
  // })
  // @UseGuards(InjectUssdUserAuthGuard)
  // async allSavingsGoalByuser(@Param() params: any): Promise<any> {

  //   return (await this.service.allSavingsGoalByuser(params.id)) as Promise<any>;
  // }

  @Post('/usersavinggoals')
  @ApiResponse({
    status: 200,
    description: "Get Savings goal of dialing user"
  })
  @UseGuards(InjectUssdUserAuthGuard)
  async allSavingsGoalByuser(): Promise<any> {
    const res=await this.service.allSavingsGoalByuser()
   console.log("res usersavinggoals",res)
    return res

  }

  @Get('/user/receiver/:id')
  @ApiResponse({
    status: 200,
    description: "Get Savings goal of dialing user"
  })
  @UseGuards(InjectUssdUserAuthGuard)
  async getReceiverDetails(@Param('id') mobile: any): Promise<any> {

 
    const response = new GenericResponse();
   try {
    
    const res=await this.service.getReceiverDetails(mobile)
    return res
   } catch (error) {
    console.log("error>>>",error)
    response.status='01'
    response.message='User not found'
    return response
   }
   
   
  }
  

  @Put('/usersavinggoals/:id')
  @ApiResponse({
    status: 200,
    description: "Get Savings goal of dialing user"
  })
  @UseGuards(InjectUssdUserAuthGuard)
  async editSavingsGoalByuser(

    @Body() dto: SavingsGoalInputEditDto, //: { name: string },
    @Param() params: any,
  ): Promise<SavingsGoalDto> {
    const res=await this.service.editSavingsGoalByuser(params.id, dto)
   // console.log("res",res)

    return res
  }
  

  @Post('/deposit')
  @UseGuards(InjectUssdUserAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Deposit into savingsgoal",
    type: GenericResponse,
  })
  async depositToWallet(@Body() request: DepositDto): Promise<GenericResponse> {
    return (await this.service.depositToWallet(request)) as GenericResponse;
  }

  //Withdraw Savings Goal
  @Post('/withdrawal')
  @UseGuards(InjectUssdUserAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Withdraw from savingsgoal",
    type: GenericResponse,
  })
  async withdrawFromWallet(@Body() request: WithdrawalDto): Promise<GenericResponse> {
    return (await this.service.withdrawFromWallet(request)) as GenericResponse;
  }


  // @Post('/tranfer')
  // @UseGuards(InjectUssdUserAuthGuard)
  // @ApiResponse({
  //   status: 200,
  //   description: "Withdraw from savingsgoal",
  //   type: GenericResponse,
  // })
  // async transferFromWallet(@Body() request: WithdrawalDto): Promise<GenericResponse> {
  //   return (await this.service.transferFromWallet(request)) as GenericResponse;
  // }


  //Transfer to Another Bezo Account
  @Post('/transfer')
  @UseGuards(InjectUssdUserAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Transfer to another Bezo Wallet",
    type: GenericResponse,
  })
  async transfer(@Body() request: TransferDto): Promise<GenericResponse> {
    return (await this.service.transfer(request)) as GenericResponse;
  }

  @Post('/checkbalance')
  @UseGuards(InjectUssdUserAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Check primary Account Balance",
    type: GenericResponse,
  })
  async walletBalance(@Body() request: WalletDto): Promise<GenericResponse> {
    return (await this.service.walletBalance(request)) as GenericResponse;
  }



  @Put('/users/pin')
  @UseGuards(InjectUssdUserAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Pin",
    type: GenericResponse,
  })
  async updateUserPin(
    @Body() request: any,
  ): Promise<GenericResponse> {
    return await this.service.updateUserPinUSSD(request);
  }

  @Post('/users/pin')
  @UseGuards(InjectUssdUserAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Pin",
    type: GenericResponse,
  })
  async verifyUserPin(
    @Body() request: any,
  ): Promise<GenericResponse> {
    console.log("request body",request)
    return await this.service.verifyUserPin(request);
  }

}

