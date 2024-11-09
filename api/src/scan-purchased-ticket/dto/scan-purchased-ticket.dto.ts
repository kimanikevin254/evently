import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ScanPurchasedTicketDto {
	@ApiProperty({
		description: 'The ID of the event',
		example: '9038f8a4-6a49-4fc7-9f1d-0cbaede8d697',
	})
	@IsString()
	@IsNotEmpty()
	@IsUUID()
	eventId: string;

	@ApiProperty({
		description: 'The ticket ID of the event',
		example: '9038f8a4-6a49-4fc7-9f1d-0cbaede8d697',
	})
	@IsString()
	@IsNotEmpty()
	@IsUUID()
	eventTicketId: string;

	@ApiProperty({
		description: 'The purchased ticket ID of the attendee',
		example: '9038f8a4-6a49-4fc7-9f1d-0cbaede8d697',
	})
	@IsString()
	@IsNotEmpty()
	@IsUUID()
	purchasedTicketId: string;
}
