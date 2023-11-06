import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Hablitar el Cors
  app.enableCors();

  
  app.useGlobalPipes(
    new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    })
   );

  const PORT = process.env.PORT ?? 3000;

  console.log(`App coriendo en puerto : ${PORT}`);

  await app.listen(PORT);
}



 
bootstrap();
