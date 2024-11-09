import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/common/services/prisma.service';

@Injectable()
export class UserService {
	constructor(private prismaService: PrismaService) {}

	async create(data: Prisma.UserCreateInput) {
		try {
			// Create the user
			const user = await this.prismaService.user.create({
				data: {
					name: data.name,
					email: data.email,
					passwordHash: data.passwordHash,
				},
			});

			return {
				message: 'User created successfully',
				userId: user.id,
			};
		} catch (error) {
			// Check if the error is a Prisma Client Known Request Error
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					// Unique constraint violation code
					throw new HttpException(
						'This email is already registered. Please log in',
						HttpStatus.BAD_REQUEST,
					);
				}
			}

			// For other errors, rethrow them
			throw new HttpException(
				'An error occured while creating the user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findOne(data: Prisma.UserWhereUniqueInput) {
		const user = await this.prismaService.user.findUnique({
			where: { ...data },
		});

		if (!user) {
			throw new HttpException(
				'User does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		return user;
	}

	async updateOne(
		where: Prisma.UserWhereUniqueInput,
		data: Prisma.UserUpdateInput,
	) {
		try {
			return this.prismaService.user.update({ where, data });
		} catch (error) {
			// Check if the error is a Prisma Client Known Request Error
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === 'P2025') {
					// User not found
					throw new HttpException(
						'User not found',
						HttpStatus.BAD_REQUEST,
					);
				}
			}

			// For other errors, throw a generic 500
			throw new HttpException(
				'An error occured while creating the user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async profile(userId: string) {
		const user = await this.findOne({ id: userId });

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { passwordHash, ...rest } = user;

		return rest;
	}
}
