import { registerAs } from '@nestjs/config';

interface Config {
	database: {
		uri: string;
	};
	jwtSecret: string;
	mailgun: {
		domain: string;
		apiKey: string;
	};
	mailFrom: string;
	appName: string;
	frontendBaseUrl: string;
	paystackSecretKey: string;
}

export default registerAs<Config>('config', () => ({
	database: {
		uri: process.env.DATABASE_URL,
	},
	jwtSecret: process.env.JWT_ACCESS_SECRET,
	mailgun: {
		domain: process.env.MAILGUN_DOMAIN,
		apiKey: process.env.MAILGUN_API_KEY,
	},
	mailFrom: process.env.MAIL_FROM_ADDRESS,
	appName: process.env.APPLICATION_NAME,
	frontendBaseUrl: process.env.FRONTEND_BASE_URL,
	paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
}));
