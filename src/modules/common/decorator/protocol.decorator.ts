import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Protocol = createParamDecorator(
  (defaultValue: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.protocol;
  },
);
