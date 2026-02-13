import { Body, Controller, Get, Param, Post, Patch, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Controller responsável pelas rotas de usuários.
 * Prefixo: /users
 */
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Endpoint de Registro (Público).
     * POST /api/users
     * 
     * @param createUserDto Dados validados do usuário
     */
    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);

        // Boa prática: Não retornar o hash da senha
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
    }

    /**
     * Busca usuários (com filtro opcional).
     * GET /api/users?search=nome
     */
    @Get()
    async findAll(@Query('search') search?: string) {
        if (search) {
            return this.usersService.search(search);
        }
        // Retorna todos os usuários (sem senha)
        return this.usersService.findAll();
    }

    /**
     * Busca usuário por ID.
     * GET /api/users/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    /**
     * Atualiza dados de um usuário.
     * PATCH /api/users/:id
     */
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateData: Partial<CreateUserDto>) {
        const user = await this.usersService.update(id, updateData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
    }

    /**
     * Deleta um usuário.
     * DELETE /api/users/:id
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        const user = await this.usersService.delete(id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
    }
}
