import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
	CustomRequest,
	UserInterface,
} from '../interfaces/custom-request.interface';

export const User = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): UserInterface => {
		const request: CustomRequest = ctx.switchToHttp().getRequest();

		return request.user;
	},
);
