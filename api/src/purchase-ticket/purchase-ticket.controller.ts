import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { PurchaseTicketService } from './purchase-ticket.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { UserInterface } from 'src/common/interfaces/custom-request.interface';
import { User } from 'src/common/decorators/user.decorator';
import { Response } from 'express';

@ApiTags('purchase-ticket')
@Controller('purchase-ticket')
export class PurchaseTicketController {
	constructor(
		private readonly purchaseTicketService: PurchaseTicketService,
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
	paystackWebhook(@Body() webhookData: any, @Res() res: Response) {
		console.log(webhookData);
		res.sendStatus(200);
		this.purchaseTicketService.handlePaystackWebhookData(webhookData);
	}
}
