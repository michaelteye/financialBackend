import {
  Controller,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';

import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import {
  RoleAuthGuard,
  RoleAuth,
} from '../../auth/guards/role-auth.guard';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDto } from '../dtos/payment-method.dto';
import { isUUID } from 'class-validator';
import { plainToClass } from 'class-transformer';


@ApiTags('Payment Methods')
@ApiBearerAuth('JWT')
@Controller('users/payment-methods')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))

export class PaymentMethodController {
  constructor(private service: PaymentMethodService) { }

  @RoleAuth(AuthUserRole.User)
  @Post()
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: PaymentMethodDto,
  })
  async create(@Body() request: PaymentMethodDto): Promise<PaymentMethodDto> {
    return await this.service.create(request);
  }


  @RoleAuth(AuthUserRole.Admin)
  @Post('/migrate')
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: PaymentMethodDto,
  })
  async createPaymentMethod(@Body() request: PaymentMethodDto): Promise<PaymentMethodDto> {
    return await this.service.createPaymentMethod(request);
  }
  

  // @RoleAuth(AuthUserRole.User)
  // @Get(':id')
  // @ApiParam({ name: 'id', required: true, type: String })
  // @ApiResponse({
  //   status: 201,
  //   type: SavingsGoalDto,
  // })
  // async get(@Param() params: any): Promise<SavingsGoalDto> {
  //   if (params.id && !isUUID(params.id))
  //     throw new Error(
  //       `Invalid id, UUID format expected but received ${params.id}`,
  //     );
  //   const savingsGoal = (await this.service.get(params.id)) as SavingsGoalDto;
  //   return plainToClass(SavingsGoalDto, savingsGoal);
  // }

  @RoleAuth(AuthUserRole.User)
  @Put(':id')
  @ApiResponse({ status: 200, type: PaymentMethodDto })
  @ApiParam({ name: 'id', required: true, type: String })
  async update(
    @Body() dto: PaymentMethodDto, //: { name: string },
    @Param() params: any,
  ): Promise<PaymentMethodDto> {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    const paymentmethod = await this.service.update(params.id, dto);
    return plainToClass(PaymentMethodDto, paymentmethod);
  }


  
  // @RoleAuth(AuthUserRole.User)
  // @Patch('/favourite/:id')
  // @ApiResponse({ status: 200, type: SavingsGoalDto })
  // @ApiParam({ name: 'id', required: true, type: String })
  // async updateFavourite(
  //   @Body() dto: { isFavorite: boolean },
  //   @Param() params: any
  // ): Promise<SavingsGoalDto> {
  //   if (params.id && !isUUID(params.id))
  //     throw new Error(
  //       `Invalid id, UUID format expected but received ${params.id}`,
  //     );
  //   const savingsGoal = await this.service.updateFavourite(params.id, dto);
  //   return plainToClass(SavingsGoalDto, savingsGoal);
  // }

  @RoleAuth(AuthUserRole.User)
  @Delete(':id')
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({
    status: 200,
  })
  async delete(@Param() params: any): Promise<any> {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    return this.service.delete(params.id);
  }


  @RoleAuth(AuthUserRole.User)
  @Get()
  @ApiResponse({
    status: 201,
    type: [PaymentMethodDto],
  })
  async getAll(): Promise<PaymentMethodDto[]> {
    return (await this.service.all()) as PaymentMethodDto[];
  }
}
