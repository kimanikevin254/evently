import { Module } from '@nestjs/common';
import { ScanPurchasedTicketService } from './scan-purchased-ticket.service';
import { ScanPurchasedTicketController } from './scan-purchased-ticket.controller';
import { CommonModule } from 'src/common/common.module';
import { EventModule } from 'src/event/event.module';
import { TicketModule } from 'src/ticket/ticket.module';
import { PurchaseTicketModule } from 'src/purchase-ticket/purchase-ticket.module';

@Module({
	controllers: [ScanPurchasedTicketController],
	providers: [ScanPurchasedTicketService],
	imports: [CommonModule, EventModule, TicketModule, PurchaseTicketModule],
})
export class ScanPurchasedTicketModule {}
