import { Injectable, NestMiddleware } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Request, Response } from 'express';
import { IUser } from '@app/common/interface/user.interface';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: IUser;
    }
  }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}
  async use(req: Request, res: Response, next: (error?: any) => void) {
    const { userId } = req.session || {};
    console.log(userId);

    if (userId) {
      const user = await this.usersService.findById(userId);
      req.currentUser = user;
    }

    next();
  }
}
