import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { EventModule } from 'src/event/event.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
	imports: [CommonModule, EventModule],
})
export class UserModule {}
