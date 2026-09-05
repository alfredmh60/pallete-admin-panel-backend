import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SELLER_REQUEST_KEY } from '../seller-auth.guard';
import type { ValidatedSeller } from '../seller-auth.service';

export const CurrentSeller = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ValidatedSeller => {
    const request = ctx.switchToHttp().getRequest();
    return request[SELLER_REQUEST_KEY];
  },
);
