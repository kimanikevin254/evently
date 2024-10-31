import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/interfaces/custom-request.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventService } from './event.service';

@ApiTags('event')
@Controller('event')
export class EventController {
	constructor(private readonly eventService: EventService) {}

	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@ApiResponse({
		status: 201,
		description: 'Event created successfully',
	})
	@Post()
	create(
		@Body() createEventDto: CreateEventDto,
		@User() user: UserInterface,
	) {
		return this.eventService.create(createEventDto, user.id);
	}

	@Get()
	@ApiResponse({
		status: 200,
		description: 'Events data',
	})
	findAll() {
		return this.eventService.findAll();
	}

	@ApiResponse({
		status: 404,
		description: 'Event not found',
	})
	@ApiResponse({
		status: 200,
		description: 'Event data',
	})
	@Get(':eventId')
	findOne(@Param('eventId') eventId: string) {
		return this.eventService.findOne(eventId);
	}

	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@Patch(':eventId')
	@ApiResponse({
		status: 404,
		description: 'Event not found',
	})
	@ApiResponse({
		status: 400,
		description: 'User does not have permission to update event',
	})
	@ApiResponse({
		status: 200,
		description: 'Event sucessfully updated',
	})
	update(
		@Param('eventId') eventId: string,
		@Body() updateEventDto: UpdateEventDto,
		@User() user: UserInterface,
	) {
		return this.eventService.update(eventId, updateEventDto, user.id);
	}

	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@Delete(':eventId')
	@ApiResponse({
		status: 404,
		description: 'Event not found',
	})
	@ApiResponse({
		status: 400,
		description: 'User does not have permission to delete event',
	})
	@ApiResponse({
		status: 200,
		description: 'Event sucessfully deleted',
	})
	remove(@Param('eventId') eventId: string, @User() user: UserInterface) {
		return this.eventService.remove(eventId, user.id);
	}
}
