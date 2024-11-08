import { TicketPurchase } from '@prisma/client';

export interface ExtendedTicketPurchaseInterface extends TicketPurchase {
	ticket: {
		id: string;
		name: string;
		event: {
			id: string;
			name: string;
			startDateTime: Date;
			address: string;
		};
	};
	purchasedBy: {
		id: string;
		name: string;
		email: string;
	};
}
