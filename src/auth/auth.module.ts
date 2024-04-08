import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersService } from 'src/users/users.service';
import { HelperFunctions } from 'src/helpers/helper.functions';
import { DBModule } from 'src/database/mongoose.module';
import { UsersModule } from 'src/users/users.module';
import { RateLimiterModule } from 'nestjs-rate-limiter';

@Module({
  imports:[UsersModule,DBModule,RateLimiterModule],
  controllers: [AuthController],
  providers:[UsersService,HelperFunctions]
})
export class AuthModule {}
