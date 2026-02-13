import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

        if (user && user.password && (await argon2.verify(user.password, pass))) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, twoFactorSecret, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
                twoFactorEnabled: user.twoFactorEnabled,
            }
        };
    }

    async validateGoogleUser(profile: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }) {
        let user = await this.usersService.findByGoogleId(profile.googleId);

        if (!user) {
            user = await this.usersService.findByEmail(profile.email);

            if (user) {
                user = await this.usersService.updateGoogleId(user.id, profile.googleId);
            } else {
                user = await this.usersService.createGoogleUser(profile);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, twoFactorSecret, ...result } = user;
        return result;
    }

    async generate2FASecret(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new BadRequestException('Usuário não encontrado');

        const secret = speakeasy.generateSecret({
            name: `Toolzz Chat (${user.email})`,
            length: 32,
        });

        // Salva o segredo (temporário, só ativa quando verificar)
        await this.usersService.update2FASecret(userId, secret.base32);

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        return {
            secret: secret.base32,
            qrCode: qrCodeUrl,
        };
    }

    async verify2FAToken(userId: string, token: string): Promise<boolean> {
        const user = await this.usersService.findById(userId);
        if (!user || !user.twoFactorSecret) {
            throw new BadRequestException('2FA não configurado');
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2,
        });

        return verified;
    }

    async enable2FA(userId: string, token: string) {
        const verified = await this.verify2FAToken(userId, token);
        if (!verified) {
            throw new UnauthorizedException('Token inválido');
        }

        await this.usersService.enable2FA(userId);
        return { message: '2FA ativado com sucesso!' };
    }

    async disable2FA(userId: string, token: string) {
        const verified = await this.verify2FAToken(userId, token);
        if (!verified) {
            throw new UnauthorizedException('Token inválido');
        }

        await this.usersService.disable2FA(userId);
        return { message: '2FA desativado com sucesso!' };
    }
}
