import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PurchaseTicketService } from './purchase-ticket.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { UserInterface } from 'src/common/interfaces/custom-request.interface';
import { User } from 'src/common/decorators/user.decorator';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@ApiTags('purchase-ticket')
@Controller('purchase-ticket')
export class PurchaseTicketController {
	constructor(
		private readonly purchaseTicketService: PurchaseTicketService,
		private configSerive: ConfigService,
	) {}

	@ApiResponse({
		status: 404,
		description: 'Ticket with the specified ID does not exist',
	})
	@ApiResponse({
		status: 200,
		description: 'Payment URL',
	})
	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@Post()
	initializeTransaction(
		@Body() initializeTransactionDto: InitializeTransactionDto,
		@User() user: UserInterface,
	) {
		return this.purchaseTicketService.initializeTransaction(
			user.id,
			initializeTransactionDto,
		);
	}

	@Post('paystack-webhook')
	paystackWebhook(
		@Body() webhookData: any,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Paystack signature validation
		if (
			crypto
				.createHmac(
					'sha512',
					this.configSerive.get<string>('config.paystackSecretKey'),
				)
				.update(JSON.stringify(webhookData))
				.digest('hex') == req.headers['x-paystack-signature']
		) {
			console.log(webhookData);
			res.sendStatus(200);
			this.purchaseTicketService.handlePaystackWebhookData(webhookData);
		}
	}
}
