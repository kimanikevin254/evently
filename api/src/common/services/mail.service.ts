import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import Mailgun from 'mailgun.js';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

@Injectable()
export class MailService {
	private mailgunClient;

	private MAILGUN_KEY: string;
	private MAILGUN_DOMAIN: string;
	private MAIL_FROM: string;
	private APP_NAME: string;
	private FRONTEND_BASE_URL: string;

	constructor(private configService: ConfigService) {
		// Initialize environment variables in constructor
		this.MAILGUN_KEY = this.configService.get<string>(
			'config.mailgun.apiKey',
		);
		this.MAILGUN_DOMAIN = this.configService.get<string>(
			'config.mailgun.domain',
		);
		this.MAIL_FROM = this.configService.get<string>('config.mailFrom');
		this.APP_NAME = this.configService.get<string>('config.appName');
		this.FRONTEND_BASE_URL = this.configService.get<string>(
			'config.frontendBaseUrl',
		);

		// Initialize Mailgun client
		const mailgun = new Mailgun(FormData);
		this.mailgunClient = mailgun.client({
			username: 'api',
			key: this.MAILGUN_KEY,
		});
	}

	async sendPasswordResetMail(to: string, name: string) {
		try {
			const htmlContent = `
				<div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
					<h2 style="color: #4CAF50;">Password Reset Request</h2>
					<p>Hello ${name.split(' ')[0]},</p>
					<p>We received a request to reset your password. If you did not make this request, you can ignore this email.</p>
					<p>To reset your password, click the link below:</p>
					<a href="${this.FRONTEND_BASE_URL}/reset-password" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a>
					<p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
					<p>${this.FRONTEND_BASE_URL}/reset-password</p>
					<p>Thank you,<br>${this.APP_NAME} Team</p>
					<hr />
					<p style="font-size: 12px; color: #999;">If you did not request a password reset, please disregard this email.</p>
				</div>
				`;

			return await this.mailgunClient.messages.create(
				this.MAILGUN_DOMAIN,
				{
					from: this.MAIL_FROM,
					to,
					subject: 'Password Reset Request',
					html: htmlContent,
				},
			);
		} catch (error) {
			throw error;
		}
	}

	async sendTicketsMail(
		to: string,
		name: string,
		eventName: string,
		pdfs: string[],
	) {
		try {
			const htmlContent = `
					<div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
						<h2 style="color: #4CAF50;">Your Tickets</h2>
						<p>Hello ${name.split(' ')[0]},</p>
						<p>Thank you for your purchase. Please find your tickets attached to this email.</p>
						<p>If you have any issues, feel free to contact our support team.</p>
						<p>Thank you,<br>${this.APP_NAME} Team</p>
						<hr />
						<p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply directly to this email.</p>
					</div>
				`;
			// Attach the tickets (pdfs)
			const attachments = pdfs.map((pdfPath) => {
				const randomSuffix = randomBytes(6)
					.toString('base64')
					.replace(/[^a-zA-Z0-9]/g, '')
					.substring(0, 6)
					.toUpperCase();

				const baseName = `Ticket_${eventName.replace(/\s+/g, '_')}`; // Replace spaces with underscores
				const fileName = `${baseName}_${randomSuffix}.pdf`;

				return {
					filename: fileName,
					data: fs.createReadStream(pdfPath),
				};
			});

			return await this.mailgunClient.messages.create(
				this.MAILGUN_DOMAIN,
				{
					from: this.MAIL_FROM,
					to,
					subject: 'Evently: Your Tickets',
					html: htmlContent,
					attachment: attachments,
				},
			);
		} catch (error) {
			throw error;
		}
	}
}
