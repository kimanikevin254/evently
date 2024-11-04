import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindEventTicketsDto {
	@ApiProperty({
		description: 'The ID of the event to find tickets for',
		example: 'b9bf4160-67e7-4bb8-b452-2a74e4585aa1',
	})
	@IsNotEmpty()
	@IsString()
	eventId: string;
}
