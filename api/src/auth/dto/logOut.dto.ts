import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogOutDto {
	@ApiProperty()
	@IsString()
	refreshToken: string;
}
