import {
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { CreateEventTicketsDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { EventService } from 'src/event/event.service';

@Injectable()
export class TicketService {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => EventService))
		private eventService: EventService,
	) {}

	findEventTickets(eventId: string) {
		return this.prismaService.ticket.findMany({
			where: {
				eventId,
			},
		});
	}

	async create(createEventTicketsDto: CreateEventTicketsDto, userId: string) {
		// Retrieve event
		const event = await this.eventService.findOne(
			createEventTicketsDto.eventId,
		);

		// Make sure user owns event
		if (event.ownerId !== userId) {
			throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
		}

		// Find event tickets
		const eventTickets = await this.findEventTickets(event.id);

		// Make sure a ticket with the same name for the same event does not exist
		const existingTicketNames = eventTickets.map((ticket) => ticket.name);
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

	async findEventTicketsWithEventValidation(eventId: string) {
		// Make sure event exists
		const event = await this.eventService.findOne(eventId);

		// Return tickets
		return await this.findEventTickets(event.id);
	}

	async findTicketById(ticketId: string) {
		const ticket = await this.prismaService.ticket.findUnique({
			where: { id: ticketId },
		});

		if (!ticket) {
			throw new HttpException(
				'Ticket with specified ID does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		return ticket;
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
				totalTickets: true,
				remainingTickets: true,
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

		// Do not allow ticket price change after the ticket has been bought
		if (
			updateTicketDto.price !== undefined &&
			ticket.totalTickets !== ticket.remainingTickets
		) {
			throw new HttpException(
				'You cannot update the ticket price for a ticket that has already been bought',
				HttpStatus.BAD_REQUEST,
			);
		}
		// totalTickets cannot be lower than tickets sold to honor already sold tickets
		// Calculate tickets sold
		const ticketsSold = ticket.totalTickets - ticket.remainingTickets;

		// Check if totalTickets update would violate the rule
		if (
			updateTicketDto.totalTickets !== undefined &&
			updateTicketDto.totalTickets < ticketsSold
		) {
			throw new HttpException(
				`Total tickets cannot be less than tickets sold (${ticketsSold})`,
				HttpStatus.BAD_REQUEST,
			);
		}

		// Define updateData with the initial DTO
		const updateData: UpdateTicketDto & { remainingTickets?: number } = {
			...updateTicketDto,
		};

		// Adjust remainingTickets if totalTickets is updated
		if (updateTicketDto.totalTickets !== undefined) {
			const difference =
				updateTicketDto.totalTickets - ticket.totalTickets;

			if (difference < 0) {
				// Reduced tickets
				updateData.remainingTickets = Math.max(
					ticket.remainingTickets + difference,
					0,
				);
			} else {
				// Added tickets
				updateData.remainingTickets =
					ticket.remainingTickets + difference;
			}
		}

		// Update ticket
		return this.prismaService.ticket.update({
			where: { id: ticketId },
			data: { ...updateData },
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

	async adjustRemainingTicketsAfterPayment(
		ticketId: string,
		adjustBy: number,
	) {
		// Find ticket
		const ticket = await this.findTicketById(ticketId);

		// Adjust
		return this.prismaService.ticket.update({
			where: { id: ticketId },
			data: { remainingTickets: ticket.remainingTickets - adjustBy },
		});
	}
}
