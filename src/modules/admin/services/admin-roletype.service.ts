import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRoleTypeEntity } from '../entities/adminrole-type.entity';
import {AdminRoleTypeDto} from '../dto/admin-roletype.dto'

// import { AdminRoleTypeEntity } from './admin-role-type.entity';
// import { CreateAdminRoleTypeDto } from './dto/create-admin-role-type.dto';
// import { UpdateAdminRoleTypeDto } from './dto/update-admin-role-type.dto';

@Injectable()
export class AdminRoleTypeService {
  constructor(
    @InjectRepository(AdminRoleTypeEntity)
    private adminRoleTypeRepository: Repository<AdminRoleTypeEntity>,
  ) {}

  async create(createAdminRoleTypeDto: AdminRoleTypeDto): Promise<AdminRoleTypeEntity> {
    const { roleName, description } = createAdminRoleTypeDto;
    const adminRoleType = this.adminRoleTypeRepository.create({
      roleName,
      description,
    });
    return this.adminRoleTypeRepository.save(adminRoleType);
  }

  async findAll(): Promise<AdminRoleTypeEntity[]> {
    return this.adminRoleTypeRepository.find();
  }

  async findOne(id: string): Promise<AdminRoleTypeEntity> {
    return this.adminRoleTypeRepository.findOne({where:{id}});
  }

  async update(id: string, updateAdminRoleTypeDto: AdminRoleTypeDto): Promise<AdminRoleTypeEntity> {
    const adminRoleType = await this.adminRoleTypeRepository.findOne({where:{id}});
    if (!adminRoleType) {
      throw new NotFoundException('Admin role type not found');
    }
    const { roleName, description } = updateAdminRoleTypeDto;
    adminRoleType.roleName = roleName ?? adminRoleType.roleName;
    adminRoleType.description = description ?? adminRoleType.description;
    return this.adminRoleTypeRepository.save(adminRoleType);
  }

  async remove(id: string): Promise<void> {
    const adminRoleType = await this.adminRoleTypeRepository.findOne({where:{id}});
    if (!adminRoleType) {
      throw new NotFoundException('Admin role type not found');
    }
    await this.adminRoleTypeRepository.remove(adminRoleType);
  }
}
