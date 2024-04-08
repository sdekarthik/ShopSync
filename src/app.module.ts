import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DBModule } from './database/mongoose.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterGuard, RateLimiterModule } from 'nestjs-rate-limiter'
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  // got to DB module and create the database connection and go with the schema creation also
  // import of other modules also here
  imports: [RedisModule.forRoot({
    readyLog: true,
    config: {
      host: 'REDIS_HOST',
      port: 1234,
      password: 'PASSWORD'
    }
  }),RateLimiterModule,
  DBModule,UsersModule, AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService,{
    provide:APP_GUARD,
    useClass:RateLimiterGuard
  }],
  exports:[RateLimiterModule]
})
export class AppModule {}
