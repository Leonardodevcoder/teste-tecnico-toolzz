import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from './llm.service';
import { ChatbotService } from './chatbot.service';

@Module({
    imports: [ConfigModule],
    providers: [LLMService, ChatbotService],
    exports: [LLMService, ChatbotService],
})
export class LLMModule { }
