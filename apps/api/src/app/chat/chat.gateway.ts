import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { ChatbotService } from '../llm/chatbot.service';

@WebSocketGateway({
    cors: {
        origin: '*', // Permite Frontend (localhost:3001)
    },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');

    private onlineUsers = new Map<string, { socketId: string; user: any }>();

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
        private usersService: UsersService,
        private chatbotService: ChatbotService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Iniciado!');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;

            if (!token) {
                throw new Error('Token não fornecido');
            }

            const cleanToken = token.replace('Bearer ', '');
            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                throw new Error('JWT_SECRET não configurado');
            }

            const payload = this.jwtService.verify(cleanToken, {
                secret: jwtSecret,
            });


            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                client.disconnect();
                return;
            }

            client.data.user = user;

            this.onlineUsers.set(user.id, {
                socketId: client.id,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });

            this.logger.log(`Cliente conectado: ${user.email} (${client.id})`);

            const generalRoom = await this.chatService.getOrCreateGeneralRoom();
            client.join(generalRoom.id);
            client.emit('joinedRoom', generalRoom);

            this.logger.log(`Usuario na sala Geral (ID: ${generalRoom.id})`);

            const history = await this.chatService.getMessages(generalRoom.id);
            client.emit('history', history);

            this.broadcastOnlineUsers();

        } catch (e) {
            this.logger.error(`Conexão rejeitada: ${e.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (user) {
            this.onlineUsers.delete(user.id);
            this.broadcastOnlineUsers();
        }
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }

    private broadcastOnlineUsers() {
        const onlineUsersList = Array.from(this.onlineUsers.values()).map(u => u.user);
        this.server.emit('onlineUsers', onlineUsersList);
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; isTyping: boolean },
    ) {
        const user = client.data.user;
        if (!user) return;

        client.to(payload.roomId).emit('userTyping', {
            user: { name: user.name || user.email },
            isTyping: payload.isTyping,
        });
    }

    @SubscribeMessage('msgToServer')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { content: string; roomId: string },
    ) {
        const user = client.data.user;
        if (!user) return;

        const savedMessage = await this.chatService.saveMessage(user.id, payload.roomId, payload.content);

        this.logger.log(`Mensagem recebida de ${user.email} na sala ${payload.roomId}`);

        this.server.to(payload.roomId).emit('msgToClient', savedMessage);

        if (this.chatbotService.isBotCommand(payload.content)) {
            this.logger.log(`Bot command detected: ${payload.content}`);

            try {
                const botResponse = await this.chatbotService.processCommand(
                    payload.content,
                    user.name || user.email
                );

                const botMessage = await this.chatService.saveMessage(
                    'bot',
                    payload.roomId,
                    botResponse
                );

                this.server.to(payload.roomId).emit('msgToClient', botMessage);
            } catch (error) {
                this.logger.error(`Bot error: ${error.message}`);
            }
        } else {
            const autoResponse = this.chatbotService.getAutoResponse(payload.content);
            if (autoResponse) {
                const botMessage = await this.chatService.saveMessage(
                    'bot',
                    payload.roomId,
                    autoResponse
                );

                this.server.to(payload.roomId).emit('msgToClient', botMessage);
            }
        }
    }


    @SubscribeMessage('joinPrivateRoom')
    async handleJoinPrivateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { targetUserId: string },
    ) {
        const user = client.data.user;
        if (!user) return;

        const privateRoom = await this.chatService.getOrCreatePrivateRoom(user.id, payload.targetUserId);

        const rooms = Array.from(client.rooms);
        rooms.forEach((room) => {
            if (room !== client.id) {
                client.leave(room);
            }
        });

        client.join(privateRoom.id);

        const targetUser = await this.usersService.findById(payload.targetUserId);

        client.emit('joinedRoom', {
            ...privateRoom,
            otherUser: targetUser ? { id: targetUser.id, name: targetUser.name, email: targetUser.email } : null,
        });

        const history = await this.chatService.getMessages(privateRoom.id);
        client.emit('history', history);

        this.logger.log(`Usuario ${user.email} entrou em sala privada com ${targetUser?.email}`);
    }
}
