import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { CommonModule } from 'src/common/common.module';
import { EventModule } from 'src/event/event.module';

@Module({
	controllers: [TicketController],
	providers: [TicketService],
	imports: [CommonModule, EventModule],
})
export class TicketModule {}
