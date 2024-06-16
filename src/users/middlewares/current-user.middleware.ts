import { Injectable, NestMiddleware } from '@nestjs/common';
import { UsersService } from '../users.service';
import { Request, Response } from 'express';
import { User } from 'src/entities/user.entity';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}
  async use(req: Request, res: Response, next: (error?: any) => void) {
    const { userId } = req.session || {};

    if (userId) {
      const user = await this.usersService.findById(userId);
      req.currentUser = user;
    }

    next();
  }
}
