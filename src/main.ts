import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Global prefix
  app.setGlobalPrefix('v1');
  
  // CORS
  app.enableCors();
  
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Document Management API')
    .setDescription('Backend service for managing documents with folders, tags, scoped actions, OCR webhooks, RBAC, auditing, and metrics')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Documents', 'Document management operations')
    .addTag('Folders', 'Folder operations based on primary tags')
    .addTag('Search', 'Full-text search across documents')
    .addTag('Actions', 'Scoped actions on documents')
    .addTag('Webhooks', 'OCR webhook ingestion')
    .addTag('Metrics', 'System metrics and statistics')
    .addTag('Tags', 'Tag management')
    .addTag('Users', 'User management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
