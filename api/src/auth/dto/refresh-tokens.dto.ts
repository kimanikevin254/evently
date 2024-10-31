import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokensDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	userId: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	refreshToken: string;
}
