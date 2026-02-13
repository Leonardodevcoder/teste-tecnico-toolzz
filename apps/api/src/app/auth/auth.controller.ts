import { Body, Controller, Post, UnauthorizedException, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        if (user.twoFactorEnabled) {
            return {
                requires2FA: true,
                userId: user.id,
                message: 'Digite o código 2FA',
            };
        }

        return this.authService.login(user);
    }

    @Post('login/2fa')
    async login2FA(@Body() body: { userId: string; token: string }) {
        const verified = await this.authService.verify2FAToken(body.userId, body.token);
        if (!verified) {
            throw new UnauthorizedException('Código 2FA inválido');
        }

        const user = await this.authService['usersService'].findById(body.userId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, twoFactorSecret, ...result } = user;
        return this.authService.login(result);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res) {
        const user = req.user;
        const token = await this.authService.login(user);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}?token=${token.access_token}&user=${encodeURIComponent(JSON.stringify(token.user))}`);
    }

    @Get('2fa/generate')
    @UseGuards(JwtAuthGuard)
    async generate2FA(@Req() req) {
        const userId = req.user.sub;
        return this.authService.generate2FASecret(userId);
    }

    @Post('2fa/verify')
    @UseGuards(JwtAuthGuard)
    async verify2FA(@Req() req, @Body() body: { token: string }) {
        const userId = req.user.sub;
        const verified = await this.authService.verify2FAToken(userId, body.token);
        return { verified };
    }

    @Post('2fa/enable')
    @UseGuards(JwtAuthGuard)
    async enable2FA(@Req() req, @Body() body: { token: string }) {
        const userId = req.user.sub;
        return this.authService.enable2FA(userId, body.token);
    }

    @Post('2fa/disable')
    @UseGuards(JwtAuthGuard)
    async disable2FA(@Req() req, @Body() body: { token: string }) {
        const userId = req.user.sub;
        return this.authService.disable2FA(userId, body.token);
    }
}
