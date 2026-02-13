import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { LLMModule } from '../llm/llm.module';

@Module({
    imports: [AuthModule, UsersModule, LLMModule],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
})
export class ChatModule { }
