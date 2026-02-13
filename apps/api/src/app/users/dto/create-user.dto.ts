import { IsEmail, IsString, MinLength, IsOptional, MaxLength, IsEnum } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, {
        message: 'O e-mail fornecido não é válido.'
    })
    email: string;

    @IsString()
    @MinLength(6, {
        message: 'A senha deve ter pelo menos 6 caracteres.'
    })
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsEnum(['ADMIN', 'TEACHER', 'STUDENT'], {
        message: 'O perfil deve ser ADMIN, TEACHER ou STUDENT.'
    })
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
}
