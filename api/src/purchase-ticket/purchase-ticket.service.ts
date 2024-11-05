import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { UserService } from 'src/user/user.service';
import { TicketService } from 'src/ticket/ticket.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { TicketPurchase } from '@prisma/client';
import { join } from 'path';
import * as QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

@Injectable()
export class PurchaseTicketService {
	constructor(
		private paystackService: PaystackService,
		private userService: UserService,
		private ticketService: TicketService,
		private prismaService: PrismaService,
	) {}

	private async findTicketPurchaseByPaystackRef(paystackRef: string) {
		const ticketPurchase =
			await this.prismaService.ticketPurchase.findUnique({
				where: {
					paystackRef,
				},
				include: {
					ticket: {
						select: {
							id: true,
							event: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

		if (!ticketPurchase) {
			throw new HttpException(
				'Ticket purchase with the specified Paystack ref does not exist',
				HttpStatus.NOT_FOUND,
			);
		}

		return ticketPurchase;
	}

	async initializeTransaction(
		userId: string,
		initializeTransactionDto: InitializeTransactionDto,
	) {
		// Retrieve user details
		const user = await this.userService.findOne({ id: userId });

		// Retrieve ticket details
		const ticket = await this.ticketService.findTicketById(
			initializeTransactionDto.ticketId,
		);

		// Make sure remaining tickets is greater than or equal to requested quantity
		if (ticket.remainingTickets < initializeTransactionDto.quantity) {
			throw new HttpException(
				`Cannot purchase the requested tickets. The remaining tickets are only ${ticket.remainingTickets}`,
				HttpStatus.BAD_REQUEST,
			);
		}

		const initializedTransaction: any =
			await this.paystackService.initializePayment(
				user.email,
				ticket.price * initializeTransactionDto.quantity,
			);

		// Save to db
		await this.prismaService.ticketPurchase.create({
			data: {
				attendeeId: user.id,
				ticketId: ticket.id,
				quantity: initializeTransactionDto.quantity,
				paystackRef: initializedTransaction.data.reference,
			},
		});

		return initializedTransaction.data;
	}

	async handlePaystackWebhookData(webhookData: any) {
		// Handle successful charges
		if (webhookData.event === 'charge.success') {
			// Retrieve the ticket purchase
			const ticketPurchase = await this.findTicketPurchaseByPaystackRef(
				webhookData.data.reference,
			);

			// Mark the ticket purchase as paid
			await this.prismaService.ticketPurchase.update({
				where: { id: ticketPurchase.id },
				data: {
					paidAt: webhookData.data.paid_at,
				},
			});

			// Adjust the number of remaining tickets
			await this.ticketService.adjustRemainingTicketsAfterPayment(
				ticketPurchase.ticketId,
				ticketPurchase.quantity,
			);

			// Generate a purchased ticket pdf and send to user
			const qrCodePath = await this.generateQRCode(ticketPurchase);
			const pdfPath = await this.generateTicketPdf(
				ticketPurchase,
				qrCodePath,
			);

			console.log(pdfPath);
		}
	}

	private async generateQRCode(ticketPurchase: TicketPurchase) {
		const qrCodeData = JSON.stringify({
			ticketId: ticketPurchase.ticketId,
			purchaseId: ticketPurchase.id,
		});

		// Define the directory and ensure it exists
		const tempDir = join(__dirname, 'temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const qrCodePath = join(tempDir, `${ticketPurchase.id}.png`);

		await QRCode.toFile(qrCodePath, qrCodeData);

		return qrCodePath;
	}

	private async generateTicketPdf(
		ticketPurchase: TicketPurchase,
		qrCodePath: string,
	) {
		const tempDir = join(__dirname, 'temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const pdfPath = join(tempDir, `${ticketPurchase.id}.pdf`);

		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([600, 400]);
		page.drawText(`Ticket for Event ID: ${ticketPurchase.ticketId}`, {
			x: 50,
			y: 350,
		});

		const qrImage = await pdfDoc.embedPng(fs.readFileSync(qrCodePath));
		page.drawImage(qrImage, {
			x: 50,
			y: 200,
			width: 150,
			height: 150,
		});

		const pdfBytes = await pdfDoc.save();
		fs.writeFileSync(pdfPath, pdfBytes);

		return pdfPath;
	}
}
