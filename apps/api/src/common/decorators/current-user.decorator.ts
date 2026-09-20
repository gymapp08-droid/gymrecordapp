import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthUser } from '@alpha/types';

export const CurrentUser = createParamDecorator(
  (data: keyof IAuthUser | undefined, ctx: ExecutionContext): IAuthUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IAuthUser;
    return data && user ? user[data] : user;
  },
);
