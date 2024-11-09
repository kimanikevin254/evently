import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ScanPurchasedTicketService } from './scan-purchased-ticket.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ScanPurchasedTicketDto } from './dto/scan-purchased-ticket.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/interfaces/custom-request.interface';

@ApiTags('scan-purchased-ticket')
@ApiBearerAuth()
@Controller('scan-purchased-ticket')
@UseGuards(AuthGuard)
export class ScanPurchasedTicketController {
	constructor(
		private readonly scanPurchasedTicketService: ScanPurchasedTicketService,
	) {}

	@ApiResponse({
		status: 404,
		description: 'Event with specified ID does pot exist',
	})
	@ApiResponse({
		status: 404,
		description: 'Ticket with specified ID does not exist',
	})
	@ApiResponse({
		status: 403,
		description: 'Provided ticket ID does not belong to this event',
	})
	@ApiResponse({
		status: 403,
		description:
			'The purchased ticket with the provided ID has already been scanned',
	})
	@Post()
	scanPurchasedTicket(
		@Body() scanPurchasedTicketDto: ScanPurchasedTicketDto,
		@User() user: UserInterface,
	) {
		return this.scanPurchasedTicketService.scanPurchasedTicket(
			user.id,
			scanPurchasedTicketDto,
		);
	}
}
