import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Import Swagger
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  // Swagger configuration
  const config = new DocumentBuilder()
  .setTitle('Record API')
  .setDescription(`
    The record management API🎵
    
    This API provides endpoints for managing records and orders in our store.
    
    Key Features:
    - Full CRUD operations for records
    - Automatic track listing fetching from MusicBrainz
    - Advanced filtering and search capabilities
    - Order management with stock tracking
    - Pagination and sorting support
  `)
  .setVersion('1.0')
  .addTag('records', 'Record management endpoints')
  .addTag('orders', 'Order management endpoints')
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(AppConfig.port);
}
bootstrap();
