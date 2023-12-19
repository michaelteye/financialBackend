
import { Controller, Get, Post, Body, Param, Patch, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminGroupsEntity } from '../entities/admin-groups.entity';
import { AdminGroupService } from '../services/admin.group.service';
import { AdminUserGroupsEntity } from '../entities/adminuser-groups.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('admin-groups')
@ApiTags('Admin Auth')
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminGroupController {
  constructor(private readonly adminGroupService: AdminGroupService) {}

  @Get("getall")
  async getAllGroups(): Promise<AdminGroupsEntity[]> {
    return this.adminGroupService.getAllGroups();
  }

  @Post("creategroup")
  async createGroup(@Body() createGroupDto: CreateGroupDto): Promise<AdminGroupsEntity> {
  //  const { groupName, groupDescription } = createGroupDto;
    return this.adminGroupService.createGroup(createGroupDto);
  }

  @Get('getGroupById/:id')
  async getGroupById(@Param('id') groupId: string): Promise<AdminGroupsEntity> {
    return this.adminGroupService.getGroupById(groupId);
  }

  @Patch('updateGroup')
  async updateGroup(
    @Body() updateGroupDto: CreateGroupDto,
  ): Promise<AdminGroupsEntity> {
    const { groupDescription ,groupName} = updateGroupDto;
    return this.adminGroupService.updateGroup(groupName, groupDescription);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') groupId: string): Promise<void> {
    return this.adminGroupService.deleteGroup(groupId);
  }

  @Post(':groupId/users/:userId')
  async addUserToGroup(
    @Param('userId') userId: string,
    @Param('groupId') groupId: string,
  ): Promise<AdminUserGroupsEntity> {
    return this.adminGroupService.addUserToGroup(userId, groupId);
  }

  @Get('group/users/:userId')
  async getGroupsUserJoins(
    @Param('userId') userId: string,
   
  ): Promise<AdminUserGroupsEntity[]> {
    return this.adminGroupService.getGroupsUserJoins(userId);
  }

  @Delete(':groupId/users/:userId')
  async deleteUserFromGroup(
    @Param('userId') userId: string,
    @Param('groupId') groupId: string,
  ): Promise<void> {
    return this.adminGroupService.deleteUserFromGroup(userId, groupId);
  }
}

