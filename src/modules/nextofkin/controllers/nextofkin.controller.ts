import {Controller,UseGuards,UsePipes,ValidationPipe,Post,Body,Get,Param,Patch, Put} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import {RoleAuthGuard,RoleAuth} from '../../../../src/modules/auth/guards/role-auth.guard';
import { AuthUserRole } from '../../../../src/modules/auth/types/auth-user.roles';
import { isUUID } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import { UserNextOfKinDto, UserNextOfKinInputEditDto } from '../../nextofkin/dtos/user_next_of_kin.dto';
import { get } from 'http';
import { NextOfKinService } from '../services/nextofkin.service';

@Controller()
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true}))
export  class NextOfKinController {
    constructor(private service: NextOfKinService){ }
  @RoleAuth(AuthUserRole.User)
  @Post('/users/nextofkin')
  @ApiResponse({
  status: 201,
  description: 'The record has been successfully created.',
  type: UserNextOfKinDto,
})
async create(@Body() request: UserNextOfKinInputEditDto): Promise<UserNextOfKinDto> {
  return await this.service.createNextOfKing(request);
}

@RoleAuth(AuthUserRole.User)
@Get('/users/nextofkin/:id')
@ApiParam({name: 'id', required: true, type: String})
@ApiResponse({
  status: 201,
  type:UserNextOfKinDto
})
async get(@Param() params: any): Promise<UserNextOfKinDto>{
  if(params.id && !isUUID(params.id))
  throw new Error(
    `Invalid id, UUID format expected but received ${params.id}`,
  );
  const nextofkin = (await this.service.getUserNextOfKing(params.id)) as UserNextOfKinDto;
  return plainToClass(UserNextOfKinDto, nextofkin)
}

@RoleAuth(AuthUserRole.User)
@Put('/users/nextofkin/update/:id')
@ApiResponse({ status: 200, type: UserNextOfKinDto })
@ApiParam({ name: 'id', required: true, type: String })
async update(
  @Body() dto: UserNextOfKinInputEditDto, //: { name: string },
  @Param() params: any,
): Promise<UserNextOfKinDto> {
  if (params.id && !isUUID(params.id))
    throw new Error(
      `Invalid id, UUID format expected but received ${params.id}`,
    );
  const nextOfKin = await this.service.UpdateNextOfKin(params.id, dto);
  return plainToClass(UserNextOfKinDto, nextOfKin);
}
}


