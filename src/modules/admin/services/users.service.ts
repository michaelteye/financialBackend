import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  APP_TYPE,
  FILE_TYPE,
  FileEntity,
  ID_TYPE,
} from '../../fileupload/entities/file.entity';
import { FileUploadService } from '../../fileupload/services/fileupload.service';
import { FilesUploadDtoResponse } from '../../fileupload/dto/uploadfiles.dto';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { UserEntity } from '../../main/entities/user.entity';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { AccountService } from '../../account/services/account.service';
import { AddressEntity } from '../../main/entities/address.entity';
import { query } from 'express';
import { UserDto, UserInputEditDto } from 'src/modules/auth/dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    // @InjectRepository(AdminGroupsTypesEntity)
    // private readonly adminGroupsRepository: Repository<AdminGroupsTypesEntity>,
    // @InjectRepository(AdminUserGroupsEntity)
    // private readonly adminUserGroupsRepository: Repository<AdminUserGroupsEntity>,
    // @InjectRepository(AdminUserEntity)
    // private readonly adminUser: Repository<AdminUserEntity>,
    @InjectEntityManager('default') private em: EntityManager,
    // private logger = new Logger('Admin_User_Service'),
    private fileService: FileUploadService,
    public accountService: AccountService,
  ) {}

  async uploadProfileIDAndProfilePicture(request: any): Promise<any> {
    // if(!request.body.idNumber){
    //   throw new HttpException('file(s) are required', 400);

    // }
    const checkIfUserExist = await this.em.findOne(AuthUserEntity, {
      where: { userId: request.userId },
    });

    if (!checkIfUserExist) {
      throw new BadRequestException(`UserId  '${request.userId}' not found`);
    }
    if (request.files) {
      if (request.files.idPicture) {
        const fileExist = (await this.em.findOne(FileEntity, {
          where: { userId: request.userId, appType: APP_TYPE.ID_CARD },
        })) as unknown as FileEntity;

        console.log('fileExist1', fileExist);
        if (fileExist) {
          var idImages = await Promise.all(
            request.files.idPicture.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          fileExist.url = idImages;
          fileExist.appType = APP_TYPE.ID_CARD;
          fileExist.idNumber = request.body.idNumber;
          fileExist.type = FILE_TYPE.image;
          fileExist.userId = request.userId;

          fileExist.idType = request.body.idType;
          await this.em.update(FileEntity, { id: fileExist.id }, fileExist);
        } else {
          var idImages = await Promise.all(
            request.files.idPicture.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          const file = new FileEntity();
          file.url = idImages;
          file.appType = APP_TYPE.ID_CARD;
          file.idNumber = request.body.idNumber;
          file.type = FILE_TYPE.image;
          file.userId = request.userId;

          file.idType = request.body.idType;
          this.em.save(FileEntity, file);
        }
      }

      if (request.files.user) {
        const fileExist = await this.em.findOne(FileEntity, {
          where: { userId: request.userId, appType: APP_TYPE.SELFIE },
        });

        console.log('fileExist2', fileExist);
        if (fileExist) {
          var selfieImage = await Promise.all(
            request.files.user.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          fileExist.url = selfieImage;
          fileExist.appType = APP_TYPE.SELFIE;
          fileExist.idNumber = '';
          fileExist.type = FILE_TYPE.image;
          fileExist.userId = request.userId;
          // fileExist.user = ctx.authUser.user;
          fileExist.idType = ID_TYPE.NONE;
          await this.em.update(FileEntity, fileExist.id, fileExist);

          // this.em.save(FileEntity, fileExist);
        } else {
          var selfieImage = await Promise.all(
            request.files.user.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );
          const file2 = new FileEntity();
          file2.url = selfieImage;
          file2.appType = APP_TYPE.SELFIE;
          file2.idNumber = '';
          file2.type = FILE_TYPE.image;
          file2.userId = request.userId;
          // file2.user = request.user;
          file2.idType = ID_TYPE.NONE;
          this.em.save(FileEntity, file2);
        }
      }

      //await this.updateRefreshToken(refreshToken, auth, 'register');
      if (request.files.user && !request.files.idPicture) {
        return {
          documentType: request.app_type,
          message: 'File(s) uploaded successfully',
          filesUrl: [...selfieImage],
        } as unknown as FilesUploadDtoResponse;
      } else if (!request.files.user && request.files.idPicture) {
        return {
          documentType: request.app_type,
          message: 'File(s) uploaded successfully',
          filesUrl: [...idImages],
        } as unknown as FilesUploadDtoResponse;
      } else if (request.files.user && request.files.idPicture) {
        return {
          documentType: request.app_type,
          message: 'File(s) uploaded successfully',
          filesUrl: [...selfieImage, ...idImages],
        } as unknown as FilesUploadDtoResponse;
      } else {
        throw new HttpException('file(s) are required', 400);
      }
    } else {
      throw new HttpException('file(s) are required', 400);
    }
  }

  async userProfile(userId) {
    const userProfile = {};

    const users = await this.em.findOne(AuthUserEntity, {
      where: {
        userId,
      },
      relations: ['user'],
    });
    console.log('users', users);

    delete users.password;
    userProfile['user_auth'] = { ...userProfile, ...users };
    let payMethods = await this.em.find(PaymentMethodEntity, {
      where: { userId: userId },
    });

    payMethods.forEach((p) => {
      delete p.createdAt;
      delete p.updatedAt;
      delete p.userId;
    });
    userProfile['paymentMethods'] = payMethods;

    const address = await this.em.findOne(AddressEntity, {
      where: { userId: userId },
    });
    userProfile['address'] = address;

    try {
      userProfile['primaryaccount'] =
        await this.accountService.getUserPrimaryAccount({
          userId: userId,
        });

      const referralInfo = await this.accountService.getUserReferral(userId);

      const querySavingGoals = `SELECT s.name as "goalName",s.description as "goalDescription",s."goalStatus",a.balance ,s."startDate" ,s."endDate",a.id as "accountId" from savings_goal_entity s 
INNER JOIN auth_user_entity u on s."userId" = u."userId"  
INNER JOIN account_entity a on s."accountId"=a.id 
WHERE u."userId"='${userId}'`;

      const userSavingsGoals = await this.em.query(querySavingGoals);

      userProfile['savingsGoals'] = userSavingsGoals;
      userProfile['referral'] = referralInfo;

      /// Adding Files

      const profilefiles = await this.em.find(FileEntity, {
        where: { userId },
        order: {
          createdAt: 'DESC',
        },
      });
      userProfile['files'] = profilefiles;

      const queryTrans = `select id,"transactionType",amount,"userRef",narration,"transactionStatus", to_char("createdAt",'YYYY-MM-DD HH24:MI') as "Date","transactionId" 
      from public.transaction_entity t
      WHERE t."accountId" IN  (
        SELECT "id"
          FROM public.account_entity  where "userId" ='${userId}'
          
       )
      or 	t."fromAccountId" IN  (
          SELECT "id"
          FROM public.account_entity  where "userId" ='${userId}'
       )
       or 	t."toAccountId" IN  (
          SELECT "id"
          FROM public.account_entity  where "userId" ='${userId}'	
       )
       order by "createdAt" desc`;

      const resTrans = await this.em.query(queryTrans);
      userProfile['transactions'] = resTrans;
    } catch (err) {
      // this.logger.error(
      //   'there was an error getting primary account balance',
      //   err,
      // );
      console.log('Error getting primary account balance', err);
    }

    return userProfile;
  }

  async UpdateUserProfile(
    userId: string,
    input: UserInputEditDto,
  ): Promise<any> {
    // if(input.userName){
    //   const checkusername  = await this.usernameExist(input.userName)
    //   console.log('checkusername >>>',checkusername);
    //   if(checkusername){
    //     throw new BadRequestException('username already exist')
    //   }
    // }

    const profile = await this.em.findOne(UserEntity, {
      where: { id: userId },
    });
    console.log('the profile is >>>>', profile);
    if (!profile) {
      throw new HttpException('profile details not found', 404);
    }
   

    profile.userName = input.userName;
    profile.firstName = input.firstName;
    profile.lastName = input.lastName;
    profile.dateOfBirth =
      typeof input.dateOfBirth === 'string'
        ? new Date(input.dateOfBirth)
        : input.dateOfBirth;
    profile.occupation = input.occupation;
    profile.gender = input.gender;
    profile.country = input.country;
    profile.region = input.region;
    console.log('the profile of the user is >>>', profile);
    const address = await this.em.findOne(AddressEntity, { where: { userId } });
    if (!address) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }

    address.homeAddress = input.homeAddress;
    address.gpsAddress = input.gpsAddress;
    console.log('the address of the user is >>>', address);
    await this.em.save(address);
    console.log('the profile of the exist user is >>>>', profile);
    return (await this.em.save(profile)) as unknown as UserDto;
  }

  async getAllUsers(){
    const query=`select auth_user_entity."userId",user_entity."firstName",user_entity."lastName",
    user_entity."gender",auth_user_entity."phone",user_entity."level", auth_user_entity."createdAt" as "createdAt"
    from auth_user_entity, user_entity 
    where  auth_user_entity."userId"=user_entity."id" order by auth_user_entity."createdAt" desc`
    return await this.em.query(query)
  }

  async adminUsersAll(){
    const query=`SELECT id, "fullName", email, phone, "accountStatus"
    FROM public.admin_user_entity;`
    return await this.em.query(query)
  }

  async changeUserLevel(userId:string,level:string):Promise<UserEntity>{
    const query=`UPDATE user_entity 	SET level='${level}' where userId='${userId}'`
    return await this.em.query(query)
  }


  async deleteAdminUser(id){
    const query=`DELETE FROM public.admin_user_entity where id='${id}' `
    return await this.em.query(query)
  }
  async getUploadImage(userId: string) {
    const checkIfUserExist = await this.em.findOne(AuthUserEntity, {
      where: { userId: userId },
    });

    if (!checkIfUserExist) {
      throw new BadRequestException(`UserId  '${userId}' not found`);
    }
    const userData = await this.em.findOne(UserEntity, {
      where: { id: userId },
      relations: ['files'],
      order: { createdAt: 'DESC' },
    });
    return userData.files
      .map((r) => {
        if (r.appType == 'ID_CARD' || r.appType == 'SELFIE') {
          return r;
        }
      })
      .splice(-2);
  }

  // async getAllGroups(): Promise<AdminGroupsTypesEntity[]> {
  //   const groups = await this.adminGroupsRepository.find();
  //   return groups;
  // }

  // async createGroup(
  //  { groupName,
  //   groupDescription
  //  }:CreateGroupDto): Promise<AdminGroupsTypesEntity> {

  //   const adminGroup = new AdminGroupsTypesEntity();

  //   const checkGroupName=await this.adminGroupsRepository.findOne({where:{groupName}})
  //   if(!checkGroupName){
  //     adminGroup.groupName = groupName;
  //     adminGroup.groupDescription = groupDescription;
  //     return await this.adminGroupsRepository.save(adminGroup);
  //   }else{
  //     throw new BadRequestException(
  //       `Group name '${groupName}' already exist`,
  //     );
  //   }

  // }

  // async getGroupById(groupId: string): Promise<AdminGroupsTypesEntity> {
  //   return await this.adminGroupsRepository.findOne({ where: { id: groupId } });
  // }

  // async updateGroup(
  //   groupName: string,
  //   groupDescription: string,
  // ): Promise<AdminGroupsTypesEntity> {
  //   const adminGroup = await this.adminGroupsRepository.findOne({
  //     where: { groupName: groupName },
  //   });
  //   adminGroup.groupName = groupName;
  //   adminGroup.groupDescription = groupDescription;
  //   return await this.adminGroupsRepository.save(adminGroup);
  // }

  // async deleteGroup(groupId: string): Promise<void> {
  //   await this.adminGroupsRepository.delete(groupId);
  // }

  // async addUserToGroup(
  //   userId: string,
  //   groupId: string,
  // ): Promise<AdminUserGroupsEntity> {
  //   const checkGroupExist = await this.adminGroupsRepository.findOne({
  //     where: { id: groupId },
  //   });

  //   const checkUserExist= await this.adminUser.findOne({where:{id:userId}})

  //   if (!checkUserExist) {
  //     throw new BadRequestException(
  //       `User with id:${checkUserExist.id} does not exist`,
  //     );
  //   }

  //   if (!checkGroupExist) {
  //     throw new BadRequestException(
  //       `Group with id:${checkGroupExist.id} does not exist`,
  //     );
  //   }

  //   const userSearch = await this.adminUserGroupsRepository.findOne({
  //     where: { userId, groupId },
  //   });

  //   if (!userSearch) {
  //     const adminUserGroup = new AdminUserGroupsEntity();
  //     adminUserGroup.userId = userId;
  //     adminUserGroup.groupId = groupId;
  //     return await this.adminUserGroupsRepository.save(adminUserGroup);
  //   } else {
  //     throw new BadRequestException('User already exist in group');
  //   }
  // }

  // async deleteUserFromGroup(userId: string, groupId: string): Promise<void> {
  //   await this.adminUserGroupsRepository.delete({ userId, groupId });
  // }
}
