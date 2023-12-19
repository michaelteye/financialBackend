import { UserEntity } from '../../main/entities/user.entity';
import { AuthUserEntity } from '../entities/auth-user.entity';

export interface IdentityInterface {
  id?: string;
  phone: string;
  email: string;
  password: string;
}
