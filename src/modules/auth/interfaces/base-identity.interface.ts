import { UserEntity } from '../../main/entities/user.entity';
import { AuthUserEntity } from '../entities/auth-user.entity';

export interface BaseIdentityInterface {
  id: string;
  user?: AuthUserEntity;
  readonly userId: string;
}
