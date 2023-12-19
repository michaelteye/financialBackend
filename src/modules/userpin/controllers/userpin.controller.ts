import {
  UseGuards,
  Controller,
  UsePipes,
  ValidationPipe,
  Get,
  Req,
  Put,
  Post,
  Body,
  Param,
  HttpException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  PinResponseDto,
  PinVerificationResponseDto,
  UserPinDto,
} from '../../userpin/dtos/user-pin.dto';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import {
  RoleAuthGuard,
  RoleAuth,
} from '../../auth/guards/role-auth.guard';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { UserPinService } from '../services/userpin.service';
import { UpdateUserPinDto } from '../dtos/user-pin.dto';

@ApiBearerAuth('JWT')
@ApiTags('User Pin / Transaction Pin')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class UserPinController {
  constructor(private service: UserPinService) {}

  @RoleAuth(AuthUserRole.User)
  @Post('/users/pin')
  @ApiResponse({
    status: 200,
    type: PinResponseDto,
  })
  async createUserPin(@Body() request: UserPinDto): Promise<PinResponseDto> {
    if(request.userPin.length!==4){
      throw new HttpException('User pin must be 4 digits', 400);
    }
    
    return await this.service.createUserPin(request);
  }

  // verify pin
  @RoleAuth(AuthUserRole.User)
  @Get('/users/pin/verify/:pin')
  @ApiParam({ name: 'pin', required: true, type: String })
  @ApiResponse({
    status: 200,
    type: PinVerificationResponseDto,
  })
  async verifyUserPin(
    @Param('pin') pin: string,
  ): Promise<PinVerificationResponseDto> {
    return await this.service.verifyUserPin(pin);
  }

  // update pin
  @RoleAuth(AuthUserRole.User)
  @Put('/users/pin')
  @ApiResponse({
    status: 200,
    type: PinResponseDto,
  })
  async updateUserPin(
    @Body() request: UpdateUserPinDto,
  ): Promise<PinResponseDto> {
    if(request.userPin.length!==4){
      throw new HttpException('User pin must be 4 digits', 400);
    }
    return await this.service.updateUserPin(request);
  }
}
