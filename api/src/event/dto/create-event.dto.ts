import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
} from 'class-validator';

export class CreateEventDto {
	@ApiProperty({
		description: 'Name of the event',
		example: 'Tech Conference 2024',
	})
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		description: 'Detailed description of the event',
		example:
			'Annual tech conference featuring speakers from various tech industries.',
	})
	@IsString()
	@IsNotEmpty()
	description: string;

	@ApiProperty({
		description: 'Start date and time of the event',
		example: '2024-10-01T10:00:00Z',
	})
	@IsDate()
	@Type(() => Date)
	startDateTime: Date;

	@ApiProperty({
		description: 'End date and time of the event',
		example: '2024-10-01T18:00:00Z',
	})
	@IsDate()
	@Type(() => Date)
	endDateTime: Date;

	@ApiProperty({
		description: 'Indicates if the event is virtual',
		example: false,
	})
	@IsBoolean()
	isVirtual: boolean;

	@ApiProperty({
		description: 'Address of the event. Optional for virtual events.',
		example: '123 Tech Road, Silicon Valley, CA',
		required: false,
	})
	@IsString()
	@IsOptional()
	address?: string;

	@ApiProperty({
		description: 'Maximum number of attendees allowed',
		example: 500,
		required: false,
	})
	@IsInt()
	@IsOptional()
	capacity?: number;

	@ApiProperty({
		description: 'Current status of the event',
		enum: EventStatus,
		example: EventStatus.DRAFT,
	})
	@IsEnum(EventStatus)
	status: EventStatus;
}
