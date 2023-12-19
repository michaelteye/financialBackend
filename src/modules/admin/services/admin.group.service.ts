import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminGroupsEntity } from '../entities/admin-groups.entity';
import { AdminUserGroupsEntity } from '../entities/adminuser-groups.entity';
import { AdminUserEntity } from '../entities/adminuser.entity';
import { CreateGroupDto } from '../dto/create-group.dto';

@Injectable()
export class AdminGroupService {
  constructor(
    @InjectRepository(AdminGroupsEntity)
    private readonly adminGroupsRepository: Repository<AdminGroupsEntity>,
    @InjectRepository(AdminUserGroupsEntity)
    private readonly adminUserGroupsRepository: Repository<AdminUserGroupsEntity>,
    @InjectRepository(AdminUserEntity)
    private readonly adminUser: Repository<AdminUserEntity>,
  ) {}

  async getAllGroups(): Promise<AdminGroupsEntity[]> {
    const groups = await this.adminGroupsRepository.find();
    return groups;
  }

  async createGroup(
   { groupName,
    groupDescription
   }:CreateGroupDto): Promise<AdminGroupsEntity> {


    const adminGroup = new AdminGroupsEntity();

    const checkGroupName=await this.adminGroupsRepository.findOne({where:{groupName}})
    if(!checkGroupName){
      adminGroup.groupName = groupName;
      adminGroup.groupDescription = groupDescription;
      return await this.adminGroupsRepository.save(adminGroup);
    }else{
      throw new BadRequestException(
        `Group name '${groupName}' already exist`,
      );
    }
    
  }

  async getGroupById(groupId: string): Promise<AdminGroupsEntity> {
    return await this.adminGroupsRepository.findOne({ where: { id: groupId } });
  }

  async updateGroup(
    groupName: string,
    groupDescription: string,
  ): Promise<AdminGroupsEntity> {
    const adminGroup = await this.adminGroupsRepository.findOne({
      where: { groupName: groupName },
    });
    adminGroup.groupName = groupName;
    adminGroup.groupDescription = groupDescription;
    return await this.adminGroupsRepository.save(adminGroup);
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.adminGroupsRepository.delete(groupId);
  }

  async addUserToGroup(
    userId: string,
    groupId: string,
  ): Promise<AdminUserGroupsEntity> {
    const checkGroupExist = await this.adminGroupsRepository.findOne({
      where: { id: groupId },
    });

    const checkUserExist= await this.adminUser.findOne({where:{id:userId}})

    if (!checkUserExist) {
      throw new BadRequestException(
        `User with id:${checkUserExist.id} does not exist`,
      );
    }

    if (!checkGroupExist) {
      throw new BadRequestException(
        `Group with id:${checkGroupExist.id} does not exist`,
      );
    }

    const userSearch = await this.adminUserGroupsRepository.findOne({
      where: { userId, groupId },
    });

    if (!userSearch) {
      const adminUserGroup = new AdminUserGroupsEntity();
      adminUserGroup.userId = userId;
      adminUserGroup.groupId = groupId;
      return await this.adminUserGroupsRepository.save(adminUserGroup);
    } else {
      throw new BadRequestException('User already exist in group');
    }
  }

  async getGroupsUserJoins(userId: string,
   ){

    
  
      const checkUserExist= await this.adminUser.findOne({where:{id:userId}})
  
      if (!checkUserExist) {
        throw new BadRequestException(
          `User with id:${checkUserExist.id} does not exist`,
        );
      }
  
    
      // const userSearch = await this.adminUserGroupsRepository.find({
      //   where: { userId},
      //   relations:[]
      // });

      const query= ` 	select  admin_user_groups_entity."id",admin_user_groups_entity."userId",admin_user_groups_entity."groupId",
      admin_groups_entity."groupName"
      from admin_user_groups_entity,admin_groups_entity where
           admin_groups_entity."id"=admin_user_groups_entity."groupId" and 
          admin_user_groups_entity."userId"='${userId}' `

      const res= await this.adminUserGroupsRepository.query(query)
      return res;

  }

  async deleteUserFromGroup(userId: string, groupId: string): Promise<void> {
    await this.adminUserGroupsRepository.delete({ userId, groupId });
  }
}
