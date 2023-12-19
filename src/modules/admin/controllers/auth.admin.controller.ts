
import {

  UsePipes,
  ValidationPipe,
  Body,
  Controller,
  Req,
  Post,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';


import { AdminAuthService } from '../services/admin-auth.service';
import { CreateUserDto } from '../dto/create-adminuser.dto';
import { LoginUserDto } from '../dto/adminlogin.dto';
import { ApiTags } from '@nestjs/swagger';


@Controller('admin')
@ApiTags('Admin Auth')
@UsePipes(new ValidationPipe({ transform: true }))
// @ApiBearerAuth('JWT')
export class AdminAuthController {
    constructor(private readonly authService: AdminAuthService) {}
    
  @Post('/login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('/create-user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }
}
