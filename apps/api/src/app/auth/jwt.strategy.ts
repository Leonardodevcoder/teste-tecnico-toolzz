import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!jwtSecret) {
            throw new Error('🚨 SECURITY ERROR: JWT_SECRET environment variable is not configured. Application cannot start.');
        }

        super({
            // Extrai o token do Header: "Authorization: Bearer <token>"
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, // Rejeita tokens vencidos
            secretOrKey: jwtSecret,
        });
    }

    /**
     * Valida o payload decodificado do token.
     * O retorno deste método é injetado em req.user.
     */
    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
