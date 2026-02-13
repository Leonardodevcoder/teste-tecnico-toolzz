import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('messages/:roomId')
    @ApiOperation({ summary: 'Buscar mensagens de uma sala' })
    @ApiParam({ name: 'roomId', description: 'ID da sala' })
    @ApiQuery({ name: 'cursor', required: false, description: 'Cursor para paginação' })
    @ApiQuery({ name: 'take', required: false, description: 'Quantidade de mensagens' })
    @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
    async getMessages(
        @Param('roomId') roomId: string,
        @Query('cursor') cursor?: string,
        @Query('take') take?: string,
        @Query('search') search?: string,
    ) {
        const takeNum = take ? parseInt(take, 10) : 50;

        if (search) {
            return this.chatService.searchMessages(roomId, search, cursor, takeNum);
        }
        return this.chatService.getMessages(roomId, cursor, takeNum);
    }
}
