import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRoleTypeEntity } from '../entities/adminrole-type.entity';
import { AdminRoleTypeDto } from '../dto/admin-roletype.dto';
import { AdminRoleTypeGroupDto } from '../dto/admin-roletype-group.dto';
import { AdminRoleGroupsEntity } from '../entities/adminrole-groups.entity';
import { AdminGroupsEntity } from '../entities/admin-groups.entity';

// import { AdminRoleTypeEntity } from './admin-role-type.entity';
// import { CreateAdminRoleTypeDto } from './dto/create-admin-role-type.dto';
// import { UpdateAdminRoleTypeDto } from './dto/update-admin-role-type.dto';

@Injectable()
export class AdminRoleTypeGroupService {
  constructor(
    @InjectRepository(AdminRoleGroupsEntity)
    private adminRoleTypeGroupRepository: Repository<AdminRoleGroupsEntity>,

    @InjectRepository(AdminRoleTypeEntity)
    private adminRoleTypeRepository: Repository<AdminRoleTypeEntity>,

    @InjectRepository(AdminGroupsEntity)
    private adminGroupsRepository: Repository<AdminGroupsEntity>,
  ) {}

  async create(roleId: string, groupId: string): Promise<any> {
    const result = await this.adminRoleTypeGroupRepository.findOne({
      where: {
        roleId,
        groupId,
      },
    });

    console.log('result', result);
    if (result) {
      throw new HttpException('Role already exist in Group', 400);
    }

    const res= await this.adminRoleTypeGroupRepository.save({
      roleId,
      groupId,
    });

    const role = await this.adminRoleTypeRepository.findOne({
      where: { id: roleId },
    });
    const group = await this.adminGroupsRepository.findOne({
      where: { id: groupId },
    });
    return {...res,roleName: role.roleName, groupName: group.groupName}
  }

  async findAll(): Promise<AdminRoleTypeEntity[]> {
    const resRoleGroups = await this.adminRoleTypeGroupRepository.find();

    const res = await Promise.all(
      resRoleGroups.map(async (r) => {
        const role = await this.adminRoleTypeRepository.findOne({
          where: { id: r.roleId },
        });
        const group = await this.adminGroupsRepository.findOne({
          where: { id: r.groupId },
        });
        return { ...r, roleName: role.roleName, groupName: group.groupName };
      }),
    );
    return res;
  }

  //   async findOne(id: string): Promise<AdminRoleTypeEntity> {
  //     return this.adminRoleTypeRepository.findOne({where:{id}});
  //   }

  //   async update(id: string, updateAdminRoleTypeDto: AdminRoleTypeDto): Promise<AdminRoleTypeEntity> {
  //     const adminRoleType = await this.adminRoleTypeRepository.findOne({where:{id}});
  //     if (!adminRoleType) {
  //       throw new NotFoundException('Admin role type not found');
  //     }
  //     const { roleName, description } = updateAdminRoleTypeDto;
  //     adminRoleType.roleName = roleName ?? adminRoleType.roleName;
  //     adminRoleType.description = description ?? adminRoleType.description;
  //     return this.adminRoleTypeRepository.save(adminRoleType);
  //   }

  async remove(roleId: string, groupId: string): Promise<any> {
    // if (!adminRoleType) {
    //   throw new NotFoundException('Admin role type not found');
    // }
    // await this.adminRoleTypeRepository.remove(adminRoleType);

    const result = await this.adminRoleTypeGroupRepository.findOne({
      where: {
        roleId,
        groupId,
      },
    });
    if (!result) {
      throw new NotFoundException('Role Id or Group Id not found');
    }

    await this.adminRoleTypeGroupRepository.delete({
      roleId,
      groupId,
    });
  }
}
