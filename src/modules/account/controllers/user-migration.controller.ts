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
    HttpException,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
  import { plainToClass } from 'class-transformer';
  import { isUUID } from 'class-validator';
  import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
  import { RoleAuthGuard, RoleAuth } from '../../auth/guards/role-auth.guard';
  import { AuthUserRole } from '../../auth/types/auth-user.roles';
  import { WalletDto } from '../../wallet/dtos/wallet.dto';
  import { AccountTypeService } from '../services/account-type.service';
  import { AccountTypeDto, AccountTypeInputDto } from '../dtos/account-type.dto';
  import { migrateUserInputDto } from '../../auth/dto/register-user.dto';
  
  @ApiTags('User Migration')
  @ApiBearerAuth('JWT')
  @Controller('admin/user-migration')
  @UseGuards(MixedAuthGuard, RoleAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  export class AdminUserMigrationController {
    constructor(private service: AccountTypeService) {}
  
    
  
  
    @RoleAuth(AuthUserRole.Admin)
    @Post('/migrate')
    @ApiResponse({
      status: 201,
    })
    async migrateUser(@Body() body: migrateUserInputDto): Promise<migrateUserInputDto> {
      if (!body.phone_number){
        throw new HttpException('phone number is required', 400);
      }
      try {
        return (await this.service.migrateUser(body.phone_number)) ;
      } catch (error) {
        throw new HttpException(error, 400);
      }
     
    }


    @RoleAuth(AuthUserRole.Admin)
    @Post('/swap')
    @ApiResponse({
      status: 201,
    })
    async swapDevAndClientAuthCredentials(@Body() body: {devphone:string,userphone:string}): Promise<any> {
      if (!body.userphone){
        throw new HttpException('phone number is required', 400);
      }

      if (!body.devphone){
        throw new HttpException('devphone number is required', 400);
      }
      try {
        return (await this.service.swapDevAndClientAuthCredentials(body.devphone,body.userphone)) ;
      } catch (error) {
        throw new HttpException(error, 400);
      }
     
    }
  
   
  }
  