import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { MixedAuthGuard } from '../../../../src/modules/auth/guards/mixed-auth.guard';
import { NotificationDto } from '../dtos/notification.dto';
import { RoleAuth, RoleAuthGuard } from '../../auth/guards/role-auth.guard';
import { AuthUserRole } from '../../../../src/modules/auth/types/auth-user.roles';
import { NotificationService } from '../services/notification.service';
import { EntityManager } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { plainToClass } from 'class-transformer';

@ApiBearerAuth('JWT')
@Controller('')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@ApiTags('Notifications')
export class NotificationController {
  constructor(private service: NotificationService,
    private em:EntityManager
    ) {}

  @RoleAuth(AuthUserRole.Admin)
  @Get('admin/notifications')
  @ApiResponse({
    status: 201,
    description: 'Notification Sent',
  })
  async sendNotifications(@Body() body: NotificationDto): Promise<void> {
    return Promise.resolve();
  }


  @RoleAuth(AuthUserRole.User)
  @Get('/users/last-month/:userId')
  @ApiResponse({
    status: 201,
    description:'The for last one month retrieve successfully'
  })
  async getLastMonthNotifications(@Param('userId') userId: string) {
    return await this.service.getLastMonthNotificationsByUser(userId);
  }



  @RoleAuth(AuthUserRole.User)
  @Get('users/:userId/notifications')
  @ApiResponse({
    status:201,
    description:'user notifications with page number has return successfully'
  })
  async getAllNotificationByUser(
    @Param('userId') userId:string,
    @Query('page', ParseIntPipe) page:number =1,
    @Query('perPage', ParseIntPipe) perPage:number=20
  ){
    const {notifications, totalPages} = await this.service.getAllNotificationsByUser(userId,page,perPage)
    return {notifications, totalPages}
  }
  @RoleAuth(AuthUserRole.User)
  @Post('users/notification/:userId/read')
  @ApiResponse({
    status:201,
    description:'user notification has been read successfully'
  })
  async markAllAsRead(@Param('userId') userId: string): Promise<void> {
    await this.service.markAllAsRead(userId);
  }

  @RoleAuth(AuthUserRole.User)
  @Post('users/notification/push/subscribe')
  @ApiResponse({
    status:201,
    description:'user notification has been read successfully'
  })
  async subscribeUserToPush(@Body() request:any): Promise<any> {

   return await this.service.subscribeUserToPush(request);
  }


  @RoleAuth(AuthUserRole.User)
  @Delete('users/notification/push/unsubscribe')
  @ApiResponse({
    status:201,
    description:'user notification has been read successfully'
  })
  async unsubscribeUserToPush(@Body() request:any): Promise<any> {

   return await this.service.unsubscribeUserToPush(request.pushToken);
  }


  


  // @RoleAuth(AuthUserRole.User)
  // @Get('users/:userId/notifications')
  // @ApiResponse({
  //   status:201,
  //   description:'user notifications with page number has return successfully'
  // })
  // async checkAll(
  //   @Param('userId') userId:string,
  //   @Query('page', ParseIntPipe) page:number =1,
  //   @Query('perPage', ParseIntPipe) perPage:number=20
  // ){
  //   const {notifications, totalPages} = await this.service.checkAll(userId,page,perPage)
  //   return {notifications, totalPages}
  // }



}










