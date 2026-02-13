// apps/api/src/app/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo Global que exporta o PrismaService.
 * @Global permite que o banco seja importado em qualquer lugar sem importar o módulo manualmente.
 */
@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService], // Disponibiliza o serviço externamente
})
export class PrismaModule { }
