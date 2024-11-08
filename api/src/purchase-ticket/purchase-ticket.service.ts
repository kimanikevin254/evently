import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { UserService } from 'src/user/user.service';
import { TicketService } from 'src/ticket/ticket.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { TicketPurchase } from '@prisma/client';
import { join } from 'path';
import * as QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import { ExtendedTicketPurchaseInterface } from './interfaces/extended-ticket-purchase.interface';
import { MailService } from 'src/common/services/mail.service';

@Injectable()
export class PurchaseTicketService {
	constructor(
		private paystackService: PaystackService,
		private userService: UserService,
		private ticketService: TicketService,
		private prismaService: PrismaService,
		private mailService: MailService,
	) {}

	private async findTicketPurchasesByPaystackRef(
		paystackRef: string,
	): Promise<ExtendedTicketPurchaseInterface[]> {
		return await this.prismaService.ticketPurchase.findMany({
			where: {
				paystackRef,
			},
			include: {
				ticket: {
					select: {
						id: true,
						name: true,
						event: {
							select: {
								id: true,
								name: true,
								startDateTime: true,
								address: true,
							},
						},
					},
				},
				purchasedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});
	}

	async initializeTransaction(
		userId: string,
		initializeTransactionDto: InitializeTransactionDto,
	) {
		// Retrieve ticket details
		const ticket = await this.ticketService.findTicketById(
			initializeTransactionDto.ticketId,
		);

		// Make sure the number of provided attendee names is equal to the requested tickets quantity
		if (
			ticket.requiresName &&
			initializeTransactionDto?.attendeeNames?.length !==
				initializeTransactionDto.quantity
		) {
			throw new HttpException(
				'This ticket requires you to provide a list of attendee names with a length equal to number of tickets being purchased',
				HttpStatus.BAD_REQUEST,
			);
		}

		// Make sure remaining tickets is greater than or equal to requested quantity
		if (ticket.remainingTickets < initializeTransactionDto.quantity) {
			throw new HttpException(
				`Cannot purchase the requested tickets. The remaining tickets are only ${ticket.remainingTickets}`,
				HttpStatus.BAD_REQUEST,
			);
		}

		// Retrieve user details
		const user = await this.userService.findOne({ id: userId });

		// Initialize transaction
		const initializedTransaction: any =
			await this.paystackService.initializePayment(
				user.email,
				ticket.price * initializeTransactionDto.quantity,
			);

		// Create multiple ticket purchase records with the same payment ref
		const ticketPurchases: {
			purchasedById: string;
			ticketId: string;
			paystackRef: string;
			attendeeName: string | null;
		}[] = [];

		for (let i = 0; i < initializeTransactionDto.quantity; i++) {
			ticketPurchases.push({
				purchasedById: user.id,
				ticketId: ticket.id,
				paystackRef: initializedTransaction.data.reference,
				attendeeName: ticket.requiresName
					? initializeTransactionDto.attendeeNames[i]
					: null,
			});
		}

		// Save to db
		await this.prismaService.ticketPurchase.createMany({
			data: ticketPurchases,
		});

		return initializedTransaction.data;
	}

	async handlePaystackWebhookData(webhookData: any) {
		// Handle successful charges
		if (webhookData.event === 'charge.success') {
			// Retrieve the ticket purchase
			const ticketPurchases = await this.findTicketPurchasesByPaystackRef(
				webhookData.data.reference as string,
			);

			// Mark the ticket purchases as paid
			const idsToUpdate = ticketPurchases.map((purchase) => purchase.id);

			await this.prismaService.ticketPurchase.updateMany({
				where: {
					id: {
						in: idsToUpdate,
					},
				},
				data: {
					paidAt: webhookData.data.paid_at,
				},
			});

			// Adjust the number of remaining tickets
			await this.ticketService.adjustRemainingTicketsAfterPayment(
				ticketPurchases[0].ticketId,
				idsToUpdate.length,
			);

			// Generate a purchased ticket pdf and send to user
			return this.generateTicketAndSendToUser(ticketPurchases);
		}
	}

	private async generateTicketAndSendToUser(
		ticketPurchases: ExtendedTicketPurchaseInterface[],
	) {
		// Generate PDFs and QR codes and collect their paths
		const filesToCleanUp = await Promise.all(
			ticketPurchases.map(async (purchase) => {
				const qrCodePath = await this.generateQRCode(purchase);
				const pdfPath = await this.generateTicketPdf(
					purchase,
					qrCodePath,
				);
				return { pdfPath, qrCodePath };
			}),
		);

		try {
			// Extract only the PDF paths to send as attachments
			const pdfsToSend = filesToCleanUp.map(({ pdfPath }) => pdfPath);

			// Send the tickets via email
			await this.mailService.sendTicketsMail(
				ticketPurchases[0].purchasedBy.email,
				ticketPurchases[0].purchasedBy.name,
				ticketPurchases[0].ticket.event.name,
				pdfsToSend,
			);

			// Clean up generated files (PDFs and QR codes)
			await Promise.all(
				filesToCleanUp.map(async ({ pdfPath, qrCodePath }) => {
					await fs.promises.unlink(pdfPath); // Deletes the PDF file
					await fs.promises.unlink(qrCodePath); // Deletes the QR code file
				}),
			);
		} catch (error) {
			console.log('An error occurred', error);
		}
	}

	private async generateQRCode(ticketPurchase: TicketPurchase) {
		const qrCodeData = JSON.stringify({
			ticketId: ticketPurchase.ticketId,
			purchaseId: ticketPurchase.id,
		});

		// Define the directory and ensure it exists
		const tempDir = join(process.cwd(), 'temp');

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const qrCodePath = join(tempDir, `${ticketPurchase.id}.png`);

		await QRCode.toFile(qrCodePath, qrCodeData);

		return qrCodePath;
	}

	private async generateTicketPdf(
		ticketPurchase: ExtendedTicketPurchaseInterface,
		qrCodePath: string,
	) {
		const tempDir = join(process.cwd(), 'temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const pdfPath = join(tempDir, `${ticketPurchase.id}.pdf`);

		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([300, 150]);

		const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

		// Set background color
		page.drawRectangle({
			x: 0,
			y: 0,
			width: page.getWidth(),
			height: page.getHeight(),
			color: rgb(
				0.06666666666666667,
				0.047058823529411764,
				0.2549019607843137,
			),
		});

		const eventName = ticketPurchase.ticket.event.name;

		page.drawText(
			eventName.length > 75 ? eventName.slice(0, 75) + '...' : eventName,
			{
				x: 10,
				y: 130,
				maxWidth: 150,
				size: 12,
				lineHeight: 14,
				color: rgb(1, 1, 1),
			},
		);

		page.drawText(
			`Date: ${new Date(ticketPurchase.ticket.event.startDateTime).toDateString()}`,
			{
				x: 10,
				y: 85,
				maxWidth: 150,
				size: 8,
				lineHeight: 10,
				color: rgb(1, 1, 1),
			},
		);

		page.drawText(
			`Time: ${new Date(ticketPurchase.ticket.event.startDateTime).toTimeString()}`,
			{
				x: 10,
				y: 70,
				maxWidth: 150,
				size: 8,
				lineHeight: 10,
				color: rgb(1, 1, 1),
			},
		);

		page.drawText(`Location: ${ticketPurchase.ticket.event.address}`, {
			x: 10,
			y: 45,
			maxWidth: 150,
			size: 8,
			lineHeight: 10,
			color: rgb(1, 1, 1),
		});

		page.drawLine({
			start: { x: 170, y: 140 },
			end: { x: 170, y: 10 },
			thickness: 0.6,
			color: rgb(1, 1, 1),
		});

		const ticketNameSize = 10;
		const textWidth = helveticaFont.widthOfTextAtSize(
			ticketPurchase.ticket.name,
			ticketNameSize,
		);

		page.drawText(ticketPurchase.ticket.name, {
			x: 170 + (300 - 170) / 2 - textWidth / 2,
			y: 120,
			size: ticketNameSize,
			lineHeight: 10,
			color: rgb(1, 1, 1),
		});

		const qrImage = await pdfDoc.embedPng(fs.readFileSync(qrCodePath));
		page.drawImage(qrImage, {
			x: 200,
			y: 40,
			width: 70,
			height: 70,
		});

		if (ticketPurchase.attendeeName) {
			const attendeeNameSize = 10;
			const attendeeNameWidth = helveticaFont.widthOfTextAtSize(
				ticketPurchase.attendeeName,
				ticketNameSize,
			);

			page.drawText(ticketPurchase.attendeeName, {
				x: 170 + (300 - 170) / 2 - attendeeNameWidth / 2,
				y: 20,
				size: attendeeNameSize,
				lineHeight: 10,
				color: rgb(1, 1, 1),
			});
		}

		const pdfBytes = await pdfDoc.save();
		fs.writeFileSync(pdfPath, pdfBytes);

		return pdfPath;
	}
}
