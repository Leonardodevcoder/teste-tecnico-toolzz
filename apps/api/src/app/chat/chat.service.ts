import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getOrCreateGeneralRoom() {
        const existing = await this.prisma.room.findFirst({
            where: { name: 'General' },
        });
        if (existing) return existing;

        return this.prisma.room.create({
            data: {
                name: 'General',
                type: 'GROUP',
            },
        });
    }

    async getOrCreatePrivateRoom(userId1: string, userId2: string) {
        // Ordena IDs para garantir nome consistente
        const [user1, user2] = [userId1, userId2].sort();
        const roomName = `private-${user1}-${user2}`;

        const existing = await this.prisma.room.findFirst({
            where: { name: roomName },
        });
        if (existing) return existing;

        return this.prisma.room.create({
            data: {
                name: roomName,
                type: 'DIRECT',
            },
        });
    }

    async saveMessage(userId: string, roomId: string, content: string) {
        return this.prisma.message.create({
            data: {
                content,
                userId,
                roomId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    async getMessages(roomId: string, cursor?: string, take = 50) {
        const messages = await this.prisma.message.findMany({
            where: { roomId },
            take: take + 1, // Pega 1 a mais para saber se tem próxima página
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1, // Pula o cursor
            }),
            orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        const hasMore = messages.length > take;
        const data = hasMore ? messages.slice(0, -1) : messages;

        return {
            messages: data.reverse(), // Inverte para cronológico (antigas → novas)
            hasMore,
            nextCursor: hasMore ? data[data.length - 1].id : null,
        };
    }

    async searchMessages(roomId: string, query: string, cursor?: string, take = 20) {
        const messages = await this.prisma.message.findMany({
            where: {
                roomId,
                content: {
                    contains: query,
                },
            },
            take: take + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
            },
        });

        const hasMore = messages.length > take;
        const data = hasMore ? messages.slice(0, -1) : messages;

        return {
            messages: data.reverse(),
            hasMore,
            nextCursor: hasMore ? data[data.length - 1].id : null,
            total: await this.prisma.message.count({
                where: {
                    roomId,
                    content: {
                        contains: query,
                    },
                },
            }),
        };
    }
}
