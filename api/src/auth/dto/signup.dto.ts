import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class SignUpDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty({ message: 'Name should not be empty.' })
	name: string;

	@ApiProperty()
	@IsEmail()
	@IsNotEmpty({ message: 'Email should not be empty.' })
	email: string;

	@ApiProperty()
	@IsString()
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		{
			message:
				'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.',
		},
	)
	password: string;
}
