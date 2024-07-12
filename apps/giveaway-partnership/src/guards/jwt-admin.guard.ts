import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { JwtPayload } from '../auth/types';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const user = context.switchToHttp().getRequest().user as JwtPayload;

    return user.admin;
  }
}
