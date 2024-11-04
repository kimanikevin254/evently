import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

// ANSI color codes
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

@Catch()
export class CatchAllExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger();

	constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

	catch(exception: unknown, host: ArgumentsHost) {
		// In certain situations `httpAdapter` might not be available in the
		// constructor method, thus we should resolve it here.
		const { httpAdapter } = this.httpAdapterHost;

		const ctx = host.switchToHttp();
		const request = ctx.getRequest();

		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			exception instanceof BadRequestException
				? (exception.getResponse() as { message: string | string[] })
						.message
				: exception instanceof HttpException
					? exception.message
					: 'Something went wrong';

		const path = httpAdapter.getRequestUrl(ctx.getRequest());
		const timestamp = new Date().toISOString();
		const method = request.method;

		const errorDetails =
			exception instanceof HttpException
				? exception.getResponse()
				: exception;

		// Custom colored log format
		const logMessage = `${BOLD}${YELLOW}[${path}]${RESET} ${BOLD}${method} ${RED}${status} - ${message}${RESET}\n${YELLOW}Error details:${RESET} ${JSON.stringify(errorDetails)}`;
		this.logger.log(logMessage);

		httpAdapter.reply(
			ctx.getResponse(),
			{ error: { status, message, path, timestamp } },
			status,
		);
	}
}
