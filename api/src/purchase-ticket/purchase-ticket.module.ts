import { Module } from '@nestjs/common';
import { PurchaseTicketService } from './purchase-ticket.service';
import { PurchaseTicketController } from './purchase-ticket.controller';
import { UserModule } from 'src/user/user.module';
import { TicketModule } from 'src/ticket/ticket.module';
import { PaystackService } from './paystack.service';
import { CommonModule } from 'src/common/common.module';

@Module({
	controllers: [PurchaseTicketController],
	providers: [PurchaseTicketService, PaystackService],
	imports: [UserModule, TicketModule, CommonModule],
	exports: [PurchaseTicketService],
})
export class PurchaseTicketModule {}
