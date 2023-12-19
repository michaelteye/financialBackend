import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RoleEntityType } from '../enums/role.entity-type.enum';
import { AdminRoleEntity } from '../entities/adminrole.entity';

@Injectable()
export class RoleManagerService {
  constructor(
    @InjectRepository(AdminRoleEntity)
    private readonly roleRepository: Repository<AdminRoleEntity>,
  ) {}

  async addUserToRole(userId: string, roleId: string): Promise<AdminRoleEntity> {
    const role = await this.roleRepository.findOne({where:{id:roleId}});
    if (!role) {
      throw new Error('Role not found');
    }
    role.entityId = userId;
    return this.roleRepository.save(role);
  }

  async addGroupToRole(groupId: string, roleId: string): Promise<AdminRoleEntity> {
    const role = await this.roleRepository.findOne({where:{id:roleId}});
    if (!role) {
      throw new Error('Role not found');
    }
    role.entityId = groupId;
    role.joinType = RoleEntityType.Group;
    return this.roleRepository.save(role);
  }

  async removeUserFromRole(userId: string, roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({where:{id:roleId}});
    if (!role) {
      throw new Error('Role not found');
    }
    if (role.entityId !== userId) {
      throw new Error('User is not assigned to this role');
    }
    role.entityId = null;
    await this.roleRepository.save(role);
  }

  async removeGroupFromRole(groupId: string, roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({where:{id:roleId}})
    if (!role) {
      throw new Error('Role not found');
    }
    if (role.entityId !== groupId || role.joinType !== RoleEntityType.Group) {
      throw new Error('Group is not assigned to this role');
    }
    role.entityId = null;
    role.joinType = null;
    await this.roleRepository.save(role);
  }
}
