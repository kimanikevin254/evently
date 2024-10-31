import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
	controllers: [EventController],
	providers: [EventService],
	imports: [CommonModule, forwardRef(() => UserModule)],
	exports: [EventService],
})
export class EventModule {}
