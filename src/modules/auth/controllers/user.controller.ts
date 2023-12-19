import {
  UseGuards,
  Controller,
  UsePipes,
  ValidationPipe,
  Get,
  Body,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Put,
  Delete,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { MixedAuthGuard } from '../guards/mixed-auth.guard';
import { RoleAuthGuard, RoleAuth } from '../guards/role-auth.guard';
import { AuthUserRole } from '../types/auth-user.roles';
import { AuthService } from '../services/auth.service';
import { LoginOutput } from '../types/login-output.type';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UserDto, UserInputEditDto } from '../dto/user.dto';
import { UserService } from '../services/user.service';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  FilesUploadDtoInput,
  FilesUploadDtoResponse,
  FilesUploadUrlReplaceDtoInput,
} from '../../fileupload/dto/uploadfiles.dto';
import { isUUID } from 'class-validator';
import { plainToClass } from 'class-transformer';


@ApiBearerAuth('JWT')
@ApiTags('User Auth / User Onboarding')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private service: UserService,
  ) {}

  @RoleAuth(AuthUserRole.User)
  @Get('/users/me')
  @ApiResponse({
    status: 200,
  })
  async me(): Promise<any> {
    return this.authService.userProfile();
  }
  
  @RoleAuth(AuthUserRole.User)
  @Put('users/profile/update/:id')
  @ApiResponse({ status: 200, type: UserDto })
  @ApiParam({ name: 'id', required: true, type: String })
  async update(
    @Body() dto: UserInputEditDto, //: { name: string },
    @Param() params: any,
  ): Promise<UserDto> {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    const Userprofile = await this.authService.UpdateUserProfile(
      params.id,
      dto,
    );
    return plainToClass(UserDto, Userprofile);
  }


  @RoleAuth(AuthUserRole.User)
  @Get('/users/upload')
  @ApiResponse({
    status: 200,
  })
  async getUploadImage(): Promise<any> {
    return this.authService.getUploadImage();
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/users/profile/upload')
  @ApiResponse({
    status: 200,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      // 👈  multiple files with different field names
      { name: 'profilePic', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // 👈  field names need to be repeated for swagger
        profilePic: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  //uploadFile(@UploadedFile() file: Express.Multer.File) {
  async uploadProfilePic(
    @Body() body: FilesUploadDtoInput,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    const data = {
      body: body,
      files,
    };
    return this.authService.uploadProfilePic(data);
  }

  // @RoleAuth(AuthUserRole.User)
  // @Post('/users/upload')
  // @UseInterceptors(FilesInterceptor('files'))
  //   @ApiConsumes('multipart/form-data')
  // @ApiResponse({
  //   status: 201,
  //   description: 'Files uploaded',
  //   type: FilesUploadDtoResponse,
  // })

  @RoleAuth(AuthUserRole.User)
  @Post('/users/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      // 👈  multiple files with different field names
      { name: 'idPicture', maxCount: 1 },
      { name: 'idPictureBack', maxCount: 1 },
      { name: 'user', maxCount: 1 },
      
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // 👈  field names need to be repeated for swagger
        idPicture: {
          type: 'string',
          format: 'binary',
        },

        idPictureBack: {
          type: 'string',
          format: 'binary',
        },
        user: {
          type: 'string',
          format: 'binary',
        },
        idType: {
          type: 'string',
        },

        idNumber: {
          type: 'string',
        },
      },
    },
  })
  async uploadMultipleFiles(
    @Body() body: FilesUploadDtoInput,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const data = {
      body: body,
      files,
    };
    return await this.service.uploadProfileIDAndProfilePicture(data);
  }



  ////////////////////


  @RoleAuth(AuthUserRole.Admin)
  @Post('/users/upload/migrate')
  @UseInterceptors(
    FileFieldsInterceptor([
      // 👈  multiple files with different field names
      { name: 'idPicture', maxCount: 1 },
      { name: 'user', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // 👈  field names need to be repeated for swagger
        idPicture: {
          type: 'string',
          format: 'binary',
        },
        user: {
          type: 'string',
          format: 'binary',
        },
        idType: {
          type: 'string',
        },

        idNumber: {
          type: 'string',
        },
      },
    },
  })
  async uploadMultipleFilesMigrate(
    @Body() body: FilesUploadDtoInput,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const data = {
      body: body,
      files,
    };
    return await this.service.uploadProfileIDAndProfilePictureMigrate(data);
  }


  
  @RoleAuth(AuthUserRole.Admin)
  @Post('/users/upload/migrate/replace')
  async uploadProfileIDAndProfileUrlReplace(
    @Body() body: FilesUploadUrlReplaceDtoInput,
    
  ) {
  
    return await this.service.uploadProfileIDAndProfileUrlReplace(body);
  }


  // async uploadProfileIDAndProfilePicture(
  //   @UploadedFiles()    files: Array<Express.Multer.File[]>,
  //   @Body() body: FilesUploadDtoInput,
  // ): Promise<any> {
  //   if (files) {
  //     body.files = files;
  //   }
  // return await this.service.uploadProfileIDAndProfilePicture(body);
  // }

  @RoleAuth(AuthUserRole.User)
  @Post('/users/refresh_token')
  @ApiResponse({
    status: 200,
    type: LoginOutput,
  })
  async refreshToken(@Body() data: RefreshTokenDto): Promise<LoginOutput> {
    return this.authService.refreshToken(data.token);
  }

  @RoleAuth(AuthUserRole.User)

  @Get('/users/verify/:username')
  @ApiParam({ name: 'username', required: true, type: String })
  @ApiResponse({
    status: 201,
    type: UserDto,
  })
  async verify(@Param('username') params: any): Promise<UserDto> {
    if (params.startsWith('233') === true) {
      return this.service.verifyUserByPhone(params)
    } else {
      return this.service.verifyUserByUserName(params);
    }
  }


  @RoleAuth(AuthUserRole.User)
  @Delete('/users/profilepic/:userId')
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({
    status: 200,
  })
  async deleteProfilePic(@Param() params: any): Promise<any> {
    if (params.userId && !isUUID(params.userId))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
      //IMAGE ID
    await this.service.deleteProfilePic(params.userId);
  }

  @Put("/users/account/upgrade/:userId")
  @ApiResponse({
    status: 200
  })
  async uogreateUserAccount(@Param() params: any): Promise<any> {
    try {
       return await this.authService.upgradeUserAccount(params.userId);
    }catch(e) {
      throw new HttpException("Error upgrading user account", 400);
    }
  }
}
