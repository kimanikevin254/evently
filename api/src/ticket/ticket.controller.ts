import {
	Controller,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateEventTicketsDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UserInterface } from 'src/common/interfaces/custom-request.interface';

@Controller('ticket')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiTags('ticket')
export class TicketController {
	constructor(private readonly ticketService: TicketService) {}

	@ApiResponse({
		status: 201,
		description: 'Tickets created successfully',
	})
	@Post()
	create(
		@Body() createEventTicketsDto: CreateEventTicketsDto,
		@User() user: UserInterface,
	) {
		return this.ticketService.create(createEventTicketsDto, user.id);
	}

	@ApiResponse({
		status: 404,
		description: 'Ticket not found',
	})
	@ApiResponse({
		status: 400,
		description: 'User does not have permission to update ticket',
	})
	@ApiResponse({
		status: 200,
		description: 'Ticket sucessfully updated',
	})
	@Patch(':ticketId')
	update(
		@Param('ticketId') ticketId: string,
		@Body() updateTicketDto: UpdateTicketDto,
		@User() user: UserInterface,
	) {
		return this.ticketService.update(ticketId, updateTicketDto, user.id);
	}

	@ApiResponse({
		status: 404,
		description: 'Ticket not found',
	})
	@ApiResponse({
		status: 400,
		description: 'User does not have permission to delete ticket',
	})
	@ApiResponse({
		status: 200,
		description: 'Ticket sucessfully deleted',
	})
	@Delete(':ticketId')
	remove(@Param('ticketId') ticketId: string, @User() user: UserInterface) {
		return this.ticketService.remove(ticketId, user.id);
	}
}
