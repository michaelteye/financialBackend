import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RoleManagerService } from '../services/rolemanager.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly roleService: RoleManagerService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const roleName = req.headers['x-role-name'] as string;
    if (!roleName) {
      throw new Error('Role name is missing');
    }

    const user = req.user; // assuming there is a middleware to attach the user object to the request
    if (!user) {
      throw new Error('User not found');
    }

    // const role = await this.roleService.getRoleForUser(user.id, roleName);
    // if (!role) {
    //   throw new Error('Unauthorized');
    // }
    next();
  }
}
