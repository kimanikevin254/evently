import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
	constructor(
		private prismaService: PrismaService,
		private userService: UserService,
	) {}

	create(createEventDto: CreateEventDto, userId: string) {
		return this.prismaService.event.create({
			data: { ...createEventDto, ownerId: userId },
		});
	}

	findAll() {
		return this.prismaService.event.findMany({
			where: { status: 'PUBLISHED' },
		});
	}

	async findOne(eventId: string) {
		const event = await this.prismaService.event.findUnique({
			where: { id: eventId },
		});

		if (!event) {
			throw new HttpException(
				'Event with specified ID does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		return event;
	}

	async update(
		eventId: string,
		updateEventDto: UpdateEventDto,
		userId: string,
	) {
		// Make sure event exists
		const event = await this.findOne(eventId);

		// Make sure the user making the request owns the event
		if (event.ownerId !== userId) {
			throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
		}

		// Update
		return this.prismaService.event.update({
			where: { id: eventId },
			data: { ...updateEventDto },
		});
	}

	async remove(eventId: string, userId: string) {
		// Make sure event exists
		const event = await this.findOne(eventId);

		// Make sure the user making the request owns the event
		if (event.ownerId !== userId) {
			throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
		}

		// Delete
		return this.prismaService.event.delete({
			where: { id: eventId },
		});
	}

	async findEventsByUserId(userId: string) {
		// Make sure user exists
		const user = await this.userService.findOne({ id: userId });

		if (!user) {
			throw new HttpException(
				'User with specified ID does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		return this.prismaService.event.findMany({
			where: { ownerId: userId },
		});
	}
}
