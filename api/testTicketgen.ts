/* eslint-disable */

const { PrismaClient } = require('@prisma/client');
const { join } = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const prisma = new PrismaClient();

const generateQRCode = async (ticketPurchase: { ticketId: any; id: any; }) => {
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
};

const generateTicketPdf = async (ticketPurchase: { id: any; ticket: { event: { name: any; startDateTime: string | number | Date; address: any; }; name: any; }; attendeeName: any; }, qrCodePath: any) => {
	const tempDir = join(__dirname, 'temp');
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
};

const getTicketPurchase = async (id: string) => {
	return await prisma.ticketPurchase.findUnique({
		where: { id },
		include: {
			ticket: {
				select: {
					id: true,
					name: true,
					event: {
						select: {
							id: true,
							name: true,
							imageUrl: true,
							startDateTime: true,
							address: true,
						},
					},
				},
			},
		},
	});
};

const main = async () => {
	try {
		const ticketPurchase = await getTicketPurchase(
			'85a97104-72d3-4b3f-aa2c-eb19cc97dfdc',
		);
		if (ticketPurchase) {
			console.log(JSON.stringify(ticketPurchase, null, 2));
			const qrCodePath = await generateQRCode(ticketPurchase);
			await generateTicketPdf(ticketPurchase, qrCodePath);
		} else {
			console.log('Ticket purchase not found.');
		}
	} catch (error) {
		console.error('Error:', error);
	}
};

main();
