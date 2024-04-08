import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DBModule } from 'src/database/mongoose.module';
import { HelperFunctions } from 'src/helpers/helper.functions';
import { RateLimiterGuard, RateLimiterModule } from 'nestjs-rate-limiter';



@Module({
  imports:[DBModule,RateLimiterModule],
  controllers: [UsersController],
  providers: [UsersService,HelperFunctions],
  exports:[UsersService]
})
export class UsersModule {}
