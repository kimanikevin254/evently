import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LogInDto } from './dto/login.dto';
import { LogOutDto } from './dto/logOut.dto';
import { RefreshTokensDto } from './dto/refresh-tokens.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/signup.dto';
import { AuthGuard } from './guards/auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('signup')
	signup(@Body() signUpDto: SignUpDto) {
		return this.authService.signup(signUpDto);
	}

	@Post('login')
	login(@Body() logInDto: LogInDto) {
		return this.authService.login(logInDto);
	}

	@Post('refresh-token')
	refreshTokens(@Body() refreshTokensDto: RefreshTokensDto) {
		return this.authService.refreshTokens(refreshTokensDto);
	}

	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Post('logout')
	logout(@Body() logOutDto: LogOutDto, @Req() req: CustomRequest) {
		return this.authService.logOut(logOutDto, req.user.id);
	}

	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@Post('change-password')
	changePassword(
		@Body() changePasswordDto: ChangePasswordDto,
		@Req() req: CustomRequest,
	) {
		return this.authService.changePassword(changePasswordDto, req.user.id);
	}

	@Post('forget-password')
	forgetPasswordPassword(
		@Body() forgetPasswordPasswordDto: ForgetPasswordDto,
	) {
		return this.authService.forgetPassword(forgetPasswordPasswordDto);
	}

	@Post('reset-password')
	resetPasswordPassword(@Body() resetPasswordPasswordDto: ResetPasswordDto) {
		return this.authService.resetPassword(resetPasswordPasswordDto);
	}
}
