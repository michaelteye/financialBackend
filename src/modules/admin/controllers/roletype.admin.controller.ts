import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AdminRoleTypeService } from '../services/admin-roletype.service';

import { AdminRoleTypeDto } from '../dto/admin-roletype.dto';
import { AdminRoleTypeGroupService } from '../services/admin.role-groups.service';

@Controller('admin/role-types')
export class AdminRoleTypeController {
  constructor(
    private readonly adminRoleTypeService: AdminRoleTypeService,
    private readonly adminRoleTypeGroupService: AdminRoleTypeGroupService,
    
    
    ) {}

  @Get()
  async findAll() {
    return this.adminRoleTypeService.findAll();
  }

  @Post()
  async create(@Body() createAdminRoleTypeDto: AdminRoleTypeDto) {
    return this.adminRoleTypeService.create(createAdminRoleTypeDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminRoleTypeService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() adminRoleTypeDto: AdminRoleTypeDto) {
    return this.adminRoleTypeService.update(id, adminRoleTypeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminRoleTypeService.remove(id);
  }


  
  @Post(':roleId/group/:groupId')
  async addRoleToGroup(@Param('roleId') roleId: string,@Param('groupId') groupId: string):Promise<any> {
    return  this.adminRoleTypeGroupService.create(roleId,groupId)
  }

  @Delete(':roleId/group/:groupId')
  async deleteRoleToGroup(@Param('roleId') roleId: string,@Param('groupId') groupId: string):Promise<any> {
    return  await this.adminRoleTypeGroupService.remove(roleId,groupId)
  }


  @Get('/roles/groups')
  async findAllRoleGroups() {
    return this.adminRoleTypeGroupService.findAll();
  }
}
