import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class PaystackService {
	private PAYSTACK_SECRET_KEY;

	constructor(private configService: ConfigService) {
		this.PAYSTACK_SECRET_KEY = this.configService.get<string>(
			'config.paystackSecretKey',
		);
	}
	async initializePayment(email: string, amount: number) {
		return new Promise((resolve, reject) => {
			const params = JSON.stringify({
				email,
				amount: amount * 100,
			});

			const options = {
				hostname: 'api.paystack.co',
				port: 443,
				path: '/transaction/initialize',
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
					'Content-Type': 'application/json',
				},
			};

			const req = https.request(options, (res) => {
				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					const responseData = JSON.parse(data);

					if (res.statusCode === 200) {
						resolve(responseData);
					} else {
						reject(
							new HttpException(
								responseData,
								HttpStatus.BAD_REQUEST,
							),
						);
					}
				});
			});

			req.on('error', (error) => {
				console.log('ERROR', error);
				reject(
					new HttpException(
						error.message,
						HttpStatus.INTERNAL_SERVER_ERROR,
					),
				);
			});

			req.write(params);
			req.end();
		});
	}
}
