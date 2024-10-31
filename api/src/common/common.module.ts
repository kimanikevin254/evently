import { Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { PrismaService } from './services/prisma.service';

@Module({
	providers: [PrismaService, MailService],
	exports: [PrismaService, MailService],
})
export class CommonModule {}
