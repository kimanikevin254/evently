import { ApiProperty } from '@nestjs/swagger';
import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

export class InitializeTransactionDto {
	@ApiProperty({
		description: 'The ID of the ticket to purchase',
		example: '9038f8a4-6a49-4fc7-9f1d-0cbaede8d697',
	})
	@IsString()
	@IsNotEmpty()
	@IsUUID()
	ticketId: string;

	@ApiProperty({
		description: 'Number of tickets to purchase',
		example: 1,
	})
	@IsNumber()
	@IsNotEmpty()
	quantity: number;

	@ApiProperty({
		description:
			'Name(s) to appear on the ticket(s). Can be individual name(s) or a group name(s)',
		example: ['Jane Doe'],
	})
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	attendeeNames: string[];
}
