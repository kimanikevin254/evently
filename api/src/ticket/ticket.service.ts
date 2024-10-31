import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventTicketsDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { EventService } from 'src/event/event.service';

@Injectable()
export class TicketService {
	constructor(
		private prismaService: PrismaService,
		private eventService: EventService,
	) {}

	async create(createEventTicketsDto: CreateEventTicketsDto, userId: string) {
		// Retrieve event
		const event = await this.eventService.findOne(
			createEventTicketsDto.eventId,
		);

		// Make sure user owns event
		if (event.ownerId !== userId) {
			throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
		}

		// Make sure a ticket with the same name for the same event does not exist
		const existingTicketNames = event.tickets.map((ticket) => ticket.name);
		const ticketNamesToCreate = createEventTicketsDto.tickets.map(
			(ticket) => ticket.name,
		);

		if (
			ticketNamesToCreate.some((name) =>
				existingTicketNames.includes(name),
			) ||
			new Set(ticketNamesToCreate).size !== ticketNamesToCreate.length
		) {
			throw new HttpException(
				'Different tickets for same event cannot have the same name',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Create tickets
		return this.prismaService.ticket.createMany({
			data: createEventTicketsDto.tickets.map((ticket) => ({
				...ticket,
				eventId: createEventTicketsDto.eventId,
				remainingTickets: ticket.totalTickets, // Set remaining tickets to total tickets when creating tickets
			})),
		});
	}

	async update(
		ticketId: string,
		updateTicketDto: UpdateTicketDto,
		userId: string,
	) {
		// Retrieve ticket
		const ticket = await this.prismaService.ticket.findUnique({
			where: { id: ticketId },
			select: {
				id: true,
				event: {
					select: {
						ownerId: true,
					},
				},
			},
		});

		if (!ticket) {
			throw new HttpException(
				'Ticket with specified ID does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		// Make sure user owns event
		if (ticket.event.ownerId !== userId) {
			throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
		}

		// Update ticket
		return this.prismaService.ticket.update({
			where: { id: ticketId },
			data: { ...updateTicketDto },
		});
	}

	async remove(ticketId: string, userId: string) {
		// Retrieve ticket
		const ticket = await this.prismaService.ticket.findUnique({
			where: { id: ticketId },
			include: {
				event: {
					select: {
						ownerId: true,
					},
				},
			},
		});

		if (!ticket) {
			throw new HttpException(
				'Ticket with specified ID does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		// Make sure user owns event
		if (ticket.event.ownerId !== userId) {
			throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
		}

		// Disallow deleting of tickets that have been purchased
		if (ticket.remainingTickets !== ticket.totalTickets) {
			throw new HttpException(
				'You cannot delete a ticket that has been purchased.',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Update ticket
		return this.prismaService.ticket.delete({
			where: {
				id: ticketId,
			},
		});
	}
}
