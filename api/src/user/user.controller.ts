import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { EventService } from 'src/event/event.service';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('user')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly eventService: EventService,
	) {}

	@Get(':userId/events')
	getUserEvents(@Param('userId') userId: string) {
		return this.eventService.findEventsByUserId(userId);
	}
}
