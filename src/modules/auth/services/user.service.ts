import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { FilesUploadDtoResponse } from '../../fileupload/dto/uploadfiles.dto';
import {
  APP_TYPE,
  FileEntity,
  FILE_TYPE,
  ID_TYPE,
} from '../../fileupload/entities/file.entity';
import { FileUploadService } from '../../fileupload/services/fileupload.service';
import { UserEntity } from '../../main/entities/user.entity';
import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { EntityManager } from 'typeorm';
import { UserDto } from '../dto/user.dto';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { EventPublisherService } from '../../events/services/event-publisher.service';
import { LEVEL } from '../entities/enums/level.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private fileService: FileUploadService,
  ) {}

  // const user: AuthUserEntity | any = authUser;
  // user.account = authUser.user.accounts
  //   .filter((account) => account.name === 'Primary')
  //   .reduce((object, item) => Object.assign(object, item));
  // delete user.user.accounts;
  // return user;

  async verifyUserByUserName(userName: string): Promise<UserDto> {
    const getUser = await this.em
      .createQueryBuilder(UserEntity, 'UserEntity')
      .leftJoinAndSelect('UserEntity.accounts', 'accounts')
      .leftJoinAndSelect('UserEntity.files', 'files')
      .leftJoinAndSelect('UserEntity.authUser', 'authUser')
      .where(`UserEntity.userName ILIKE :value and accounts.name ='Primary'`, {
        value: `%${userName}%`,
      })
      .getMany();

    console.log('getUser', getUser);

    if (getUser.length === 0)
      throw new HttpException(
        `User(s) with username ${userName} does not exist`,
        400,
      );

    const user = getUser
      .map((r) => {
        let account = r.accounts.find((account) => account.name === 'Primary');

        if (account) {
          let phoneNumber = r.authUser.phone;

          delete r.accounts;
          delete r.authUser;

          return {
            ...r,
            account,
            phone: phoneNumber,
          };
        }
      })
      .filter((r) => r != null);

    return user as unknown as UserDto;
  }

  async verifyUserByPhone(phone: string): Promise<UserDto> {
    const authUser = await this.em.find(AuthUserEntity, {
      where: { phone: phone },
    });

    console.log('authUser', authUser);

    //console.log("getUser",getUser)
    if (authUser.length > 1) {
      throw new HttpException(
        `User with phone ${phone}  has duplicate account`,
        400,
      );
    }
    if (authUser.length === 0)
      throw new HttpException(`User with phone ${phone} does not exist`, 400);

    const getUser = await this.em.find(UserEntity, {
      where: { id: authUser[0].userId },

      relations: ['accounts', 'files', 'authUser'],
    });

    let user: any = getUser[0];
    user.account = user.accounts
      .filter((account) => account.name === 'Primary')
      .reduce((object, item) => Object.assign(object, item));

    user.phone = await user.authUser.phone;
    delete user.accounts;
    delete user.authUser;

    return [user] as unknown as UserDto;
  }

  async getUserByPhone(phone: string): Promise<UserEntity> {
    const userPhone = await this.em.findOne(AuthUserEntity, {
      where: { phone: phone },
      relations: ['user', 'user.user.accounts'],
    });
    console.log('The user', userPhone);
    return userPhone.user;
  }

  async getAuthUserByUserId(userId: string): Promise<AuthUserEntity> {
    const authUser = await this.em.findOne(AuthUserEntity, {
      where: { userId: userId },
      relations: ['user'],
    });
    return authUser;
  }

  async getAuthUserByPhone(phone: string): Promise<AuthUserEntity> {
    const authUser = await this.em.findOne(AuthUserEntity, {
      where: { phone: phone },
      relations: ['user'],
    });
    return authUser;
  }

  async uploadFiles(request: any): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();

    if (request.files) {
      const resultImages = await Promise.all(
        request.files.map(async (r) => {
          const { url } = await this.fileService.uploadFile(r);

          return url;
        }),
      );
      const file = new FileEntity();
      file.url = resultImages;
      file.appType = request.app_type;
      file.idNumber = request.id_number;
      file.type = request.file_type;
      file.userId = ctx.authUser.userId;
      file.user = ctx.authUser.user;
      file.idType = request.id_type;
      this.em.save(FileEntity, file);
      return {
        documentType: request.app_type,
        message: 'File(s) uploaded successfully',
        filesUrl: resultImages,
      } as FilesUploadDtoResponse;
    } else {
      throw new HttpException('file(s) are required', 400);
    }
  }

  async uploadProfileIDAndProfilePicture(request: any): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();

    // if(!request.body.idNumber){
    //   throw new HttpException('file(s) are required', 400);

    // }
    if (request.files) {
      if (request.files.idPicture) {
        const fileExist = (await this.em.findOne(FileEntity, {
          where: { userId: ctx.authUser.userId, appType: APP_TYPE.ID_CARD },
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
          fileExist.userId = ctx.authUser.userId;
          fileExist.user = ctx.authUser.user;
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
          file.userId = ctx.authUser.userId;
          file.user = ctx.authUser.user;
          file.idType = request.body.idType;
          this.em.save(FileEntity, file);
        }
      }

      if (request.files.user) {
        const fileExist = await this.em.findOne(FileEntity, {
          where: { userId: ctx.authUser.userId, appType: APP_TYPE.SELFIE },
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
          fileExist.userId = ctx.authUser.userId;
          fileExist.user = ctx.authUser.user;
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
          file2.userId = ctx.authUser.userId;
          file2.user = ctx.authUser.user;
          file2.idType = ID_TYPE.NONE;
          this.em.save(FileEntity, file2);
        }
      }

      if (request.files.idPictureBack) {
        const fileExist = (await this.em.findOne(FileEntity, {
          where: {
            userId: ctx.authUser.userId,
            appType: APP_TYPE.ID_CARD_BACK,
          },
        })) as unknown as FileEntity;

        console.log('fileExist1', fileExist);
        if (fileExist) {
          var idImages = await Promise.all(
            request.files.idPictureBack.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          fileExist.url = idImages;
          fileExist.appType = APP_TYPE.ID_CARD_BACK;
          fileExist.idNumber = '';
          fileExist.type = FILE_TYPE.image;
          fileExist.userId = ctx.authUser.userId;
          fileExist.user = ctx.authUser.user;
          fileExist.idType = request.body.idType;
          await this.em.update(FileEntity, { id: fileExist.id }, fileExist);
        } else {
          var idImages = await Promise.all(
            request.files.idPictureBack.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          const file = new FileEntity();
          file.url = idImages;
          file.appType = APP_TYPE.ID_CARD;
          file.idNumber = request.body.idNumber;
          file.type = FILE_TYPE.image;
          file.userId = ctx.authUser.userId;
          file.user = ctx.authUser.user;
          file.idType = request.body.idType;
          this.em.save(FileEntity, file);
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

  async uploadProfileIDAndProfilePictureMigrate(request: any): Promise<any> {
    console.log('reqest', request.body.userId, 'appType', request.body.appType);

    if (request.files) {
      if (request.files.idPicture) {
        const fileExist = (await this.em.findOne(FileEntity, {
          where: { userId: request.body.userId, appType: request.body.appType },
          order: {
            createdAt: 'DESC',
          },
        })) as unknown as FileEntity;

        // console.log('fileExist11', fileExist);
        if (fileExist) {
          var idImages = await Promise.all(
            request.files.idPicture.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          fileExist.url = idImages;

          console.log('fileExist --- 1', fileExist);

          //fileExist.user = ctx.authUser.user;

          try {
            await this.em.save(fileExist);
          } catch (error) {
            console.log('Error@idPicture', JSON.stringify(error));
          }
        } else {
          //console.log()
          console.log(' A NEW IMAGE');
        }
      }

      if (request.files.user) {
        const fileExist = await this.em.findOne(FileEntity, {
          where: { userId: request.body.userId, appType: request.body.appType },
          order: {
            createdAt: 'DESC',
          },
        });

        // console.log('fileExist2', fileExist);
        if (fileExist) {
          var selfieImage = await Promise.all(
            request.files.user.map(async (r) => {
              const { url } = await this.fileService.uploadFile(r);
              return url;
            }),
          );

          fileExist.url = selfieImage;

          // await this.em.update(FileEntity, fileExist.id, fileExist);
          try {
            await this.em.save(fileExist);
          } catch (error) {
            console.log('Error@user', JSON.stringify(error));
          }

          // this.em.save(FileEntity, fileExist);
        } else {
          console.log(' A NEW IMAGE 2');
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

  async uploadProfileIDAndProfileUrlReplace(request: any): Promise<any> {
    //console.log('reqest', request.userId, 'appType', request.appType,'url',request.url);

    const fileExist = (await this.em.findOne(FileEntity, {
      where: { userId: request.userId, appType: request.appType },
      order: {
        createdAt: 'DESC',
      },
    })) as unknown as FileEntity;

    // console.log('fileExist11', fileExist);
    if (fileExist) {
      fileExist.url = request.url;
      //
      try {
        await this.em.save(fileExist);
      } catch (error) {
        console.log('Error@idPicture', JSON.stringify(error));
      }
    } else {
      //console.log()
      console.log(' A NEW IMAGE');
    }
  }

  async uploadFilesIdentity(request: any): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();

    if (request.files) {
      //  files=[{
      //   name:'DOcuement type',
      //   file:FIle
      //  }]

      console.log('reques', request.files);

      // const resultImages= await Promise.all(
      //   request.files.map(async(r)=>{

      //     const { url } = await this.fileService.uploadFile(r);

      //     return {url:url,document:r.name}
      //   })
      // )

      // const file = new FileEntity();

      // file.url = resultImages;
      // file.appType =request.app_type
      // file.idNumber=request.id_number
      // file.type=request.file_type
      // file.userId=ctx.authUser.userId
      // file.user=ctx.authUser.user
      // file.idType=request.id_type

      // this.em.save(FileEntity,file)

      //await this.updateRefreshToken(refreshToken, auth, 'register');
      return {
        documentType: request.app_type,
        message: 'File(s) uploaded successfully',
        filesUrl: [],
      } as FilesUploadDtoResponse;
    } else {
      throw new HttpException('file(s) are required', 400);
    }
  }

  async deleteProfilePic(userId: string): Promise<void> {
    const res = await this.em.findOne(FileEntity, {
      where: { userId: userId, appType: APP_TYPE.PROFILE },
    });
    if (res) {
      const query = `DELETE FROM file_entity where "userId"='${userId}' 
      and "appType"='${APP_TYPE.PROFILE}'`;
      await this.em.query(query);
    } else {
      throw new BadRequestException('No profile pic was found');
    }
  }
}
