import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	ArrayMinSize,
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator';

export class CreateTicketDto {
	@ApiProperty({
		description:
			'The name of the ticket type (e.g., Regular, VIP, Early Bird)',
		example: 'VIP',
	})
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		description: 'Description of the ticket type',
		example: 'Access to VIP areas and complimentary drinks',
	})
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({
		description: 'The price of the ticket',
		example: 100.0,
	})
	@IsNumber()
	@Min(0)
	price: number;

	@ApiProperty({
		description: 'Total number of tickets available for this type',
		example: 50,
	})
	@IsNumber()
	@Min(1)
	totalTickets: number;

	@ApiProperty({
		description: 'Should names of attendees be printed on tickets',
		example: true,
	})
	@IsBoolean()
	requiresName: boolean;
}

export class CreateEventTicketsDto {
	@ApiProperty({
		description: 'The ID of the event to create the ticket for',
		example: 'b9bf4160-67e7-4bb8-b452-2a74e4585aa1',
	})
	@IsString()
	@IsNotEmpty()
	eventId: string;

	@ApiProperty({
		description: 'List of tickets to create for the event',
		type: [CreateTicketDto],
	})
	@ValidateNested({ each: true })
	@Type(() => CreateTicketDto)
	@ArrayMinSize(1)
	tickets: CreateTicketDto[];
}
