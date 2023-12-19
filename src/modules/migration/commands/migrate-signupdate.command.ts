import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { JwtManagerService } from '../../auth/services/jwt-manager.service';
import { UserEntity } from '../../main/entities/user.entity';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';


@Console()
export class MigrateSignUpDateCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private readonly jwtManager: JwtManagerService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:signupdate',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ],
  })
  async execute(opts?: any) {
    try {
      return await this.defaultMigration()
    } catch (e) {
      console.error(e);
      return 1;
    }
  }
  async defaultMigration() {
    const user_profiles = await this.db
      .collection('user_profile')
      .find({})
      .toArray();
    console.log('The users count is >>', user_profiles.length);

    for (let i = 0; i < user_profiles.length; i++) {
      let user = await this.getUserByUserId(user_profiles[i].user_id);

      if (user) {
        console.log('User found>>')
        console.log('Updating User >>', user.user_id);
        user.createdAt = new Date(user_profiles[i].createdAt);
        console.log('the new createdAt is >>', user.createdAt);
        await this.em.save(user);
      }
    }
  }

  async getUserByUserId(userId: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: userId },
    });
    return user;
  }

}
