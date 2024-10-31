import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from 'src/common/services/mail.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { UserService } from 'src/user/user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LogInDto } from './dto/login.dto';
import { LogOutDto } from './dto/logOut.dto';
import { RefreshTokensDto } from './dto/refresh-tokens.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
		private prismaService: PrismaService,
		private mailService: MailService,
	) {}

	private async hashPassword(password: string) {
		const saltOrRounds = 10;
		return await bcrypt.hash(password, saltOrRounds);
	}

	private async generateTokens(userId: string) {
		try {
			const accessToken = await this.jwtService.signAsync(
				{ sub: userId },
				{ expiresIn: '1h' },
			);

			const refreshToken = randomBytes(32).toString('hex');

			// Save the refresh token to db
			await this.prismaService.refreshToken.create({
				data: {
					token: refreshToken,
					userId,
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				},
			});

			return { accessToken, refreshToken };
		} catch (error) {
			throw new HttpException(
				'Something went wrong',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async signup(signUpDto: SignUpDto) {
		const passwordHash = await this.hashPassword(signUpDto.password);

		const user = await this.userService.create({
			name: signUpDto.name,
			email: signUpDto.email,
			passwordHash,
		});

		// Generate tokens
		const tokens = await this.generateTokens(user.userId);

		return {
			tokens,
			userId: user.userId,
		};
	}

	async login(logInDto: LogInDto) {
		try {
			// Retrieve user
			const user = await this.userService.findOne({
				email: logInDto.email,
			});

			// Check if password matches
			const passwordMatches = await bcrypt.compare(
				logInDto.password,
				user.passwordHash,
			);

			if (!passwordMatches) {
				throw new Error('Passwords do not match');
			}

			// Generate tokens
			const tokens = await this.generateTokens(user.id);

			return {
				tokens,
				userId: user.id,
			};
		} catch (error) {
			// Check if the error is a Prisma Client Known Request Error => User does not exist
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					// User not found
					throw new HttpException(
						'Incorrect credentials', // Don't tell the user that the user does not exist
						HttpStatus.UNAUTHORIZED,
					);
				}
			}

			if (error.message === 'Passwords do not match') {
				throw new HttpException(
					'Incorrect credentials',
					HttpStatus.UNAUTHORIZED,
				);
			}

			// Throw a 500 for any other error
			throw new HttpException(
				'Something went wrong',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async refreshTokens(refreshTokensDto: RefreshTokensDto) {
		try {
			// Check if refresh token exists
			const refreshToken =
				await this.prismaService.refreshToken.findFirstOrThrow({
					where: {
						token: refreshTokensDto.refreshToken,
						userId: refreshTokensDto.userId,
						expiresAt: {
							gte: new Date(), // Check that expiresAt is greater than or equal to the current date
						},
					},
				});

			// Mark old refresh token as expired
			await this.prismaService.refreshToken.update({
				where: {
					id: refreshToken.id,
				},
				data: {
					expiresAt: new Date(),
				},
			});

			// Generate tokens
			const tokens = await this.generateTokens(refreshTokensDto.userId);

			return {
				tokens,
				userId: refreshTokensDto.userId,
			};
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					// Refresh token not found
					throw new HttpException(
						'Unauthorized',
						HttpStatus.UNAUTHORIZED,
					);
				}
			}

			// For any other errors, throw a generic 500
			throw new HttpException(
				'Something went wrong',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async logOut(logOutDto: LogOutDto, userId: string) {
		try {
			await this.prismaService.refreshToken.update({
				where: {
					token: logOutDto.refreshToken,
					userId,
				},
				data: {
					expiresAt: new Date(),
				},
			});
		} catch (error) {
			console.log(error.message); // No need to return any data to user here
		}
	}

	async changePassword(changePasswordDto: ChangePasswordDto, userId: string) {
		try {
			const user = await this.userService.findOne({ id: userId });

			// Check if user password is same as provided old password
			const passwordMatches = await bcrypt.compare(
				changePasswordDto.oldPassword,
				user.passwordHash,
			);

			if (!passwordMatches) {
				throw new Error('Passwords do not match');
			}

			const passwordHash = await this.hashPassword(
				changePasswordDto.newPassword,
			);

			// Update user password
			await this.userService.updateOne({ id: userId }, { passwordHash });

			return {
				message: 'Password updated successfully',
			};
		} catch (error) {
			if (error.message === 'Passwords do not match') {
				throw new HttpException(
					'Incorrect credentials',
					HttpStatus.BAD_REQUEST,
				);
			} else {
				throw new HttpException(
					'Something went wrong',
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		}
	}

	async forgetPassword(forgetPasswordDto: ForgetPasswordDto) {
		try {
			// Make sure user exists
			const user = await this.userService.findOne({
				email: forgetPasswordDto.email,
			});

			if (user) {
				// Generate a password rest token
				const passwordResetToken = randomBytes(32).toString('hex');

				// Save the password reset token to db
				await this.prismaService.passwordResetToken.create({
					data: {
						token: passwordResetToken,
						userId: user.id,
						expiresAt: new Date(Date.now() + 10 * 60 * 1000),
					},
				});

				// Send email
				await this.mailService.sendPasswordResetMail(
					forgetPasswordDto.email,
					user.name,
				);
			}

			return {
				message:
					'If this email address is registered, you will receive a password reset link.',
			};
		} catch (error) {
			if (error instanceof HttpException) {
				if (error.getStatus() === 404) {
					return {
						message:
							'If this email address is registered, you will receive a password reset link.',
					};
				} else {
					throw new HttpException(
						'Something went wrong',
						HttpStatus.INTERNAL_SERVER_ERROR,
					);
				}
			} else {
				throw new HttpException(
					'Something went wrong',
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		}
	}

	async resetPassword(resetPasswordDto: ResetPasswordDto) {
		try {
			// Check if token exists
			const passwordResetToken =
				await this.prismaService.passwordResetToken.findFirst({
					where: {
						token: resetPasswordDto.token,
						expiresAt: {
							gte: new Date(),
						},
					},
					include: {
						user: {
							select: {
								id: true,
							},
						},
					},
				});

			if (!passwordResetToken) {
				throw new Error('Invalid token');
			}

			// Reset user's password
			const hashedPassword = await this.hashPassword(
				resetPasswordDto.password,
			);

			await this.userService.updateOne(
				{ id: passwordResetToken.user.id },
				{ passwordHash: hashedPassword },
			);

			// Invalidate the token
			await this.prismaService.passwordResetToken.update({
				where: { id: passwordResetToken.id },
				data: { expiresAt: new Date() },
			});

			return {
				message:
					'Password reset successfully. You can now log in with your new credentials',
			};
		} catch (error) {
			if (error.message === 'Invalid token') {
				throw new HttpException(
					'Invalid token',
					HttpStatus.BAD_REQUEST,
				);
			}

			// Generic 500 for other errors
			throw new HttpException(
				'Something went wrong',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
