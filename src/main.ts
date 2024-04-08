import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//import { HttpExceptionFilter } from './exceptionfilter/exceptionHandler';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //await app.useGlobalFilters()
  //app.useGlobalFilters(new HttpExceptionFilter())
  //app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
