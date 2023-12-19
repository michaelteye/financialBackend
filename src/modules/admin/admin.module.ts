import { Module } from '@nestjs/common';
import { AdminAuthController } from './controllers/auth.admin.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from './entities/adminuser.entity';
import { JwtManagerService } from '../auth/services/jwt-manager.admin.service';
import { PasswordEncoderService } from '../auth/services/password-encorder.service';
import { EncryptionService } from '../auth/services/encryption.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity';
import { HttpModule } from '@nestjs/axios';
import { globalConfig } from '../../config/config';
import { ConfigType } from '@nestjs/config';
import { JwtStrategyAdmin } from '../auth/guards/jwt.admin.strategy';
import { AdminGroupController } from './controllers/group.admin.controller';
import { AdminGroupService } from './services/admin.group.service';
import { AdminGroupsEntity } from './entities/admin-groups.entity';
import { AdminUserGroupsEntity } from './entities/adminuser-groups.entity';
import { UsersController } from './controllers/users.controller';
import { FileUploadService } from '../fileupload/services/fileupload.service';
import { FileUploadModule } from '../fileupload/fileupload.module';
import { UsersService } from './services/users.service';
import { AccountService } from '../account/services/account.service';
import { AdminRoleTypeController } from './controllers/roletype.admin.controller';
import { AdminRoleEntity } from './entities/adminrole.entity';
import { AdminRoleTypeService } from './services/admin-roletype.service';
import { AdminRoleTypeEntity } from './entities/adminrole-type.entity';
import { AdminRoleTypeGroupService } from './services/admin.role-groups.service';
import { AdminRoleGroupsEntity } from './entities/adminrole-groups.entity';



@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      inject: [globalConfig.KEY],
      useFactory: async (cfg: ConfigType<typeof globalConfig>) => {
        return {
          secret: cfg.auth.jwt.secret,
          signOptions: {
            expiresIn: cfg.auth.accessToken.expiresIn,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([
      AdminUserEntity,
      RefreshTokenEntity,
      AdminGroupsEntity,
      AdminUserGroupsEntity,
      AdminRoleEntity,
      AdminRoleTypeEntity,
      AdminRoleGroupsEntity

    ]),
    FileUploadModule
  ],
  controllers: [AdminAuthController,AdminGroupController,AdminRoleTypeController,UsersController ],
  providers:[
     AdminAuthService, 
     JwtManagerService,
     PasswordEncoderService,
    EncryptionService,
    AdminGroupService,
    AccountService,
    UsersService,
    AdminRoleTypeService,
    AdminRoleTypeGroupService
    
    


  ]
})
export class AdminModule {}

