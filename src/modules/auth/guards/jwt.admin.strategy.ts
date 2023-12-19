import { UserAccountEntity } from './../../main/entities/useraccount.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { GlobalConfig, globalConfig } from '../../../config/config';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from '../../main/entities/user.entity';
import { filter } from 'rxjs';
import { AdminUserEntity } from '../../admin/entities/adminuser.entity';

@Injectable()
export class JwtStrategyAdmin extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(globalConfig.KEY) cfg: GlobalConfig,
    @InjectRepository(AdminUserEntity)
    private repository: Repository<AdminUserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.auth.jwt.secret,
    });
  }

  async validate(payload: any) {
    const userId = payload.sub;
    const authUser: Partial<AdminUserEntity> = await this.repository.findOne({
      where: { id: userId },
    });
    if (!authUser) {
      return false;
    }
    const user: AdminUserEntity | any = authUser;
  
    return user;
  }
}
