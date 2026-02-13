
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Configurar Pino como Logger Global
  const logger = app.get(Logger);
  app.useLogger(logger);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Teste Técnico Toolzz API')
    .setDescription('API para plataforma de aprendizado com Chat Real-time')
    .setVersion('1.0')
    .addTag('users', 'Gerenciamento de Usuários')
    .addTag('auth', 'Autenticação JWT')
    .addTag('chat', 'Chat Real-time e Histórico')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `📚 Swagger Documentation: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
