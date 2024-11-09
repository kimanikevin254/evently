import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { ScanPurchasedTicketDto } from './dto/scan-purchased-ticket.dto';
import { EventService } from 'src/event/event.service';
import { TicketService } from 'src/ticket/ticket.service';
import { PurchaseTicketService } from 'src/purchase-ticket/purchase-ticket.service';

@Injectable()
export class ScanPurchasedTicketService {
	constructor(
		private prismaService: PrismaService,
		private eventService: EventService,
		private ticketService: TicketService,
		private purchaseTicketService: PurchaseTicketService,
	) {}

	async scanPurchasedTicket(
		userId: string,
		scanPurchasedTicketDto: ScanPurchasedTicketDto,
	) {
		// Retrieve event
		const event = await this.eventService.findUserEvent(
			userId,
			scanPurchasedTicketDto.eventId,
		);

		// Make sure the ticket belongs to event
		const ticket = await this.ticketService.findTicketById(
			scanPurchasedTicketDto.eventTicketId,
		);

		if (ticket.eventId !== event.id) {
			throw new HttpException(
				'Provided ticket ID does not belong to this event',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Retrieve purchased ticket
		const purchasedTicket =
			await this.purchaseTicketService.retrieveTicketPurchasedById(
				scanPurchasedTicketDto.purchasedTicketId,
			);

		// Make sure purchased ticket has not been scanned
		if (purchasedTicket.scannedAt !== undefined) {
			throw new HttpException(
				'The purchased ticket with the provided ID has already been scanned',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Mark the purchased ticket as scanned
		return this.prismaService.ticketPurchase.update({
			where: { id: purchasedTicket.id },
			data: { scannedAt: new Date() },
		});
	}
}
