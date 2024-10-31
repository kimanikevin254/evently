import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import configuration from 'src/common/config/configuration';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { EventModule } from './event/event.module';
import { UserModule } from './user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		// JwtModule.registerAsync({
		// 	imports: [ConfigModule],
		// 	useFactory: async (configService: ConfigService) => {
		// 		return {
		// 			global: true,
		// 			secret: configService.get<string>('config.jwtSecret'), // using namespaced configs
		// 		};
		// 	},
		// 	inject: [ConfigService],
		// }),
		JwtModule.register({
			global: true,
			secret: process.env.JWT_SECRET,
		}),
		AuthModule,
		UserModule,
		EventModule,
		CommonModule,
	],
	controllers: [AppController],
})
export class AppModule {}
