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
    Patch,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiConsumes,
    ApiBody,
  } from '@nestjs/swagger';
 
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
import { UsersService } from '../services/users.service';
import { UserDto, UserInputEditDto } from '../../auth/dto/user.dto';  
  
  @ApiBearerAuth('JWT')
  @ApiTags('Admin / Adding User Profile')
//   @UseGuards(MixedAuthGuard, RoleAuthGuard)
  @Controller()
  @UsePipes(new ValidationPipe({ transform: true }))
  export class UsersController {
    constructor(
     // private readonly authService: AuthService,
      private service: UsersService,
    
    ) {}
  

    // @RoleAuth(AuthUserRole.User)
    // @Put('users/profile/update/:id')
    // @ApiResponse({ status: 200, type: UserDto })
    // @ApiParam({ name: 'id', required: true, type: String })
    // async update(
    //   @Body() dto: UserInputEditDto, //: { name: string },
    //   @Param() params: any,
    // ): Promise<UserDto> {
    //   if (params.id && !isUUID(params.id))
    //     throw new Error(
    //       `Invalid id, UUID format expected but received ${params.id}`,
    //     );
    //   const Userprofile = await this.authService.UpdateUserProfile(
    //     params.id,
    //     dto,
    //   );
    //   return plainToClass(UserDto, Userprofile);
    // }
  
  
    // @RoleAuth(AuthUserRole.User)
    // @Get('/users/upload')
    // @ApiResponse({
    //   status: 200,
    // })
    // async getUploadImage(): Promise<any> {
    //   return this.authService.getUploadImage();
    // }
  
    // @RoleAuth(AuthUserRole.User)
    // @Post('/users/profile/upload')
    // @ApiResponse({
    //   status: 200,
    // })
    // @UseInterceptors(
    //   FileFieldsInterceptor([
    //     // 👈  multiple files with different field names
    //     { name: 'profilePic', maxCount: 1 },
    //   ]),
    // )
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       // 👈  field names need to be repeated for swagger
    //       profilePic: {
    //         type: 'string',
    //         format: 'binary',
    //       },
    //     },
    //   },
    // })
    // //uploadFile(@UploadedFile() file: Express.Multer.File) {
    // async uploadProfilePic(
    //   @Body() body: FilesUploadDtoInput,
    //   @UploadedFiles() files: Express.Multer.File[],
    // ): Promise<any> {
    //   const data = {
    //     body: body,
    //     files,
    //   };
    //   return this.authService.uploadProfilePic(data);
    // }
  
    // @RoleAuth(AuthUserRole.User)
    // @Post('/users/upload')
    // @UseInterceptors(FilesInterceptor('files'))
    //   @ApiConsumes('multipart/form-data')
    // @ApiResponse({
    //   status: 201,
    //   description: 'Files uploaded',
    //   type: FilesUploadDtoResponse,
    // })
  
   // @RoleAuth(AuthUserRole.User)


   
    @Get('/admin/upload/:userId')
    async getUploadImage(
      @Param('userId') userId: any,
    ): Promise<any> {
      return this.service.getUploadImage(userId);
    }

    @Post('/admin/upload/:userId')
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
    async uploadMultipleFiles(
      @Body() body: FilesUploadDtoInput,
      @Param('userId') userId: any,
      @UploadedFiles() files: Express.Multer.File[],
    ) {
      const data = {
        body: body,
        userId,
        files,
      };
      return await this.service.uploadProfileIDAndProfilePicture(data);
    }


    

  @Get('/admin/user/:userId')
  @ApiResponse({
    status: 200,
  })
  async me(   @Param('userId') userId: any): Promise<any> {
    return this.service.userProfile(userId);
  }

  @Put('/admin/user/profile/update/:userId')
  @ApiResponse({
    status: 200,
  })
  async update(
    @Body() dto: UserInputEditDto, //: { name: string },
    @Param() params: any,
  ): Promise<UserDto> {
    if (params.userId && !isUUID(params.userId))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.userId}`,
      );
    const Userprofile = await this.service.UpdateUserProfile(
      params.userId,
      dto,
    );
    return plainToClass(UserDto, Userprofile);
  }

  @Patch('/admin/user/level/:userId')
  @ApiResponse({
    status: 200,
  })
  async changeUserLevel(  @Param('userId') userId: string,@Body() request:any): Promise<any> {
    return this.service.changeUserLevel(userId,request.level);
  }


  @Get('/admin/users')
  @ApiResponse({
    status: 200,
  })
  async usersAll(): Promise<any> {
    return this.service.getAllUsers();
  }


  @Get('/admin/adminusers')
  
  @ApiResponse({
    status: 200,
  })
  async adminUsersAll(): Promise<any> {
    return this.service.adminUsersAll();
  }

  @Get('/admin/adminusers/:id')
  @ApiResponse({
    status: 200,
  })
  async getAdminUser(): Promise<any> {
    return this.service.adminUsersAll();
  }

  
  @Delete('/admin/adminusers/:id')
  @ApiResponse({
    status: 200,
  })
  async deleteAdminUser(@Param() params: any): Promise<void> {
    return this.service.deleteAdminUser(params.id);
  }
  //
  
  
  
    ////////////////////
  
  
    
  
   
  }
  