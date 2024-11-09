import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { EventService } from 'src/event/event.service';
import { UserService } from './user.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/interfaces/custom-request.interface';

@Controller('user')
@ApiTags('user')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly eventService: EventService,
	) {}

	@ApiResponse({
		status: 200,
		description: 'Profile data',
	})
	@Get()
	profile(@User() user: UserInterface) {
		return this.userService.profile(user.id);
	}

	@ApiResponse({
		status: 200,
		description: 'My events',
	})
	@Get('my-events')
	getMyEvents(@User() user: UserInterface) {
		return this.eventService.findUserEvents(user.id);
	}

	@ApiResponse({
		status: 200,
		description: 'My event',
	})
	@Get('my-events/:eventId')
	getMyEvent(@User() user: UserInterface, @Param('eventId') eventId: string) {
		return this.eventService.findUserEvent(user.id, eventId);
	}
}
