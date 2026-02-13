import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, name, role } = createUserDto;

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('Este e-mail já está em uso.');
        }

        const hashedPassword = await argon2.hash(password);

        const user = await this.prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role || 'STUDENT',
            },
        });

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findAll(): Promise<any[]> {
        return this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                googleId: true,
                twoFactorSecret: false,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            },
        });
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException(`Usuário não encontrado`);
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }

    async update(id: string, updateData: Partial<CreateUserDto>): Promise<User> {
        await this.findById(id);

        const dataToUpdate: any = { ...updateData };

        if (updateData.password) {
            dataToUpdate.password = await argon2.hash(updateData.password);
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }

    async delete(id: string): Promise<User> {
        await this.findById(id);

        return this.prisma.user.delete({
            where: { id },
        });
    }

    async search(query: string): Promise<any[]> {
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            take: 20,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                googleId: true,
                twoFactorSecret: false,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            },
        });
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { googleId },
        });
    }

    async createGoogleUser(profile: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }): Promise<User> {
        const user = await this.prisma.user.create({
            data: {
                googleId: profile.googleId,
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.avatarUrl,
                password: null,
                role: 'STUDENT',
            },
        });

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }

    async updateGoogleId(userId: string, googleId: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { googleId },
        });
    }

    async update2FASecret(userId: string, secret: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });
    }

    async enable2FA(userId: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });
    }

    async disable2FA(userId: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });
    }
}
