import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateUserDto } from '../dto/create-adminuser.dto';
import { LoginUserDto } from '../dto/adminlogin.dto';
import * as bcrypt from 'bcrypt';
import { AdminUserEntity } from '../entities/adminuser.entity';
import { AccountStatus } from '../enums/account-status.enum';
import { JwtManagerService } from '../../auth/services/jwt-manager.admin.service';
import { PasswordEncoderService } from '../../auth/services/password-encorder.service';
import { getAppContextALS } from '../../../utils/context';
import { RefreshTokenEntity } from '../../auth/entities/refresh-token.entity';
import { AppRequestContext } from '../../../utils/app-request.context';
import { addSeconds } from 'date-fns';
import { globalConfig } from '../../../config/config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,

    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepository: Repository<AdminUserEntity>,
    private readonly jwtManager: JwtManagerService,

    @Inject(PasswordEncoderService)
    private readonly encoder: PasswordEncoderService,

    @Inject(globalConfig.KEY) private config: ConfigType<typeof globalConfig>,
  ) {}

  /**
   *
   * TODO modify this method to return jwt token
   */
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    let identity: AdminUserEntity;

    if (email) {
      identity = await this.adminUserRepository.findOne({
        where: { email: email },
      });
    }

    if (!identity) {
      throw new HttpException('Wrong Credentials ', 401);
    }

    if (identity.accountStatus == AccountStatus.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }

    if (!identity) {
      throw new BadRequestException('missing_identity');
    }

    const verifyPassword = this.encoder.verifyPassword(
      password,
      identity.password,
    );

    if (verifyPassword) {
      const tokens = await this.jwtManager.getTokens(identity);
      await this.updateRefreshToken(tokens.refreshToken, identity, 'login');

      return tokens;
    } else {
      throw new BadRequestException("The credentials you entered don't match our records. Please try again");
    }
    // const { username, password } = loginUserDto;
    // const user = await this.adminUserRepository.findOne({
    //   where: [{ email: username }, { phone: username }],
    // });
    // if (!user) {
    //   throw new Error('User not found');
    // }
    // if (user.accountStatus === AccountStatus.disabled) {
    //   throw new Error('Account is inactive');
    // }
    // const passwordMatches = await bcrypt.compare(password, user.password);
    // if (!passwordMatches) {
    //   throw new Error('Invalid credentials');
    // }
    // return user;
  }

  async updateRefreshToken(
    token: string,
    user?: AdminUserEntity,
    updateType?: string,
  ) {
    const ctx = getAppContextALS<AppRequestContext>();
    const hashedRefreshToken = await this.jwtManager.hashData(token);

    if (updateType === 'refresh_token') {
      const refreshToken = await this.getUserRefreshToken(ctx.authUser.id);
      console.log('update refresh token', refreshToken);
      if (!refreshToken)
        throw new BadRequestException('refresh_token_not_found');
      refreshToken.token = hashedRefreshToken;
      return await this.em.save(refreshToken);
    }
    try {
      const newToken = await this.getUserRefreshToken(user.id);
      if (newToken) {
        newToken.token = hashedRefreshToken;
        newToken.expiresAt = addSeconds(
          Date.now(),
          this.config.auth.refreshToken.expiresIn,
        );
        await this.em.save(newToken);
      } else {
        await this.saveHashToken(hashedRefreshToken, user.id);
      }
    } catch (err) {
      console.log(err);
      throw new HttpException('error saving refresh token', 500);
    }
  }

  async saveHashToken(hashedRefreshToken: string, userId: string) {
    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = userId;
    refreshTokenEntity.token = hashedRefreshToken;
    refreshTokenEntity.expiresAt = addSeconds(
      Date.now(),
      this.config.auth.refreshToken.expiresIn,
    );
    return await this.em.save(refreshTokenEntity);
  }

  async getUserRefreshToken(userId: string) {
    const userToken = await this.em.findOne(RefreshTokenEntity, {
      where: { userId },
    });
    if (userToken) return userToken;
    return false;
  }

  async createUser(createAdminUserDto: CreateUserDto): Promise<any> {
    const { fullName, email, phone, password } = createAdminUserDto;

    // const passwordHash = await bcrypt.hash(password, 10);

    const resultUserEmail = await this.adminUserRepository.findOne({
      where: { email },
    });

    const resultUserPhone = await this.adminUserRepository.findOne({
      where: { phone },
    });



    if (!resultUserEmail && !resultUserPhone) {
      const passwordHash = this.encoder.encodePassword(password);

      const user = this.adminUserRepository.create({
        email,
        password: passwordHash,
        fullName,
        phone,
        accountStatus: AccountStatus.active,
      });
      await this.adminUserRepository.save(user);
      return {
        status: '00',
        message: 'Admin sucessfully created',
      };
    }else{

      if(resultUserEmail){
        throw new BadRequestException('email already exist');
      }

      if(resultUserPhone){
        throw new BadRequestException('phone number already exist');
      }
    

    }
  }

  async deactivateUser(id: string): Promise<any> {
    const user = await this.adminUserRepository.findOne({ where: { id: id } });
    if (!user) {
      throw new Error('User not found');
    }
    user.accountStatus = AccountStatus.disabled;
    await this.adminUserRepository.save(user);
    return {
      status: '00',
      mesage: 'Admin successfully deactivated',
    };
  }
}
