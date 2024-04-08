import { Controller, Get, Post, Body, Patch, Delete, HttpStatus, HttpCode, HttpException, ValidationPipe, UsePipes, BadRequestException, NotFoundException, Headers, UnauthorizedException, Put, BadGatewayException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HelperFunctions } from 'src/helpers/helper.functions';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import { ChangeEmailDto } from './dto/change-email.dto';
import { FindShopsDto } from './dto/findShops.dto';
import { isNumber, isString } from 'class-validator';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,private helperfunnction:HelperFunctions,@InjectRedis() private client:Redis) {}

  
  @HttpCode(200)
  
  @Get("/getProfile")
  async findOne(@Headers('Authorization') jwtToken:string){
    try{
      
      // get token
      const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);
      
      // verify token and get current user
      const user=await this.helperfunnction.currentUser(jwt)
      if(await this.client.get("token:"+user['email'])){
        throw new BadGatewayException('Please login to access');
      }
      // if the user is undefined or null
      if(!user || user===null){
        throw new NotFoundException(`No user of ${user['email']} exists`)
        
      }
      // remove password and give back user profile
      const userWithoutPassword=await this.helperfunnction.removePassword([user])
      return this.helperfunnction.returnMessage(userWithoutPassword[0],200);
      
    }
    catch(error){
      
      throw this.helperfunnction.errorValidator(error)
    }
  }
  
  
  @HttpCode(200)
  @Patch("/updateUser")
  async update(@Body() updateUser: UpdateUserDto,@Headers('Authorization') jwtToken:string){
    try{
      // Dto validation
      if(await this.helperfunnction.checkValidatorDto(UpdateUserDto,updateUser)){

        // retrieve token
        const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);

        // verify token and get current user
        const currentUser=await this.helperfunnction.currentUser(jwt);

        // check for expiry
        if(await this.client.get("token:"+currentUser['email'])){
          throw new BadGatewayException('Please login to access');
        }

        // update user
        const user=await this.usersService.update(currentUser,updateUser);
        if(!user){
          throw new NotFoundException('User of such credentials not found');
        }
        return this.helperfunnction.returnMessage([],200);

      }
    }catch(error){
      throw this.helperfunnction.errorValidator(error)
      
    }
  }

  @HttpCode(200)
  @Delete('/deleteUser')
  async remove(@Headers('Authorization') jwtToken:string){
    try{

      // retrieve jwt
      const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);

      // get currentuser
      const currentUser=await this.helperfunnction.currentUser(jwt);

      // check for expiry
      if(await this.client.get("token:"+currentUser['email'])){
        throw new BadGatewayException('Please login to access');
      }

      if(currentUser){

        // deleted files can never be zero as we deleted valid user only
        const deletedFiles=await this.usersService.remove(currentUser['email']);
        if(deletedFiles['deletedCount']==0){
          // check for deleteCount from db
          throw new NotFoundException(`Cant delete user with email ${currentUser['email']}`);
        }
        return this.helperfunnction.returnMessage(`Deleted ${deletedFiles['deletedCount']} documents belonging to email ${currentUser['email']}`,200)
      }else{
        throw new UnauthorizedException('Cannot perform delete operation')
      }
    }catch(error){
      
      throw this.helperfunnction.errorValidator(error)
    }
  }

  @HttpCode(200)
  @RateLimit({ keyPrefix: 'changeEmail', points: 10, duration:60, errorMessage: 'Continuous change Email requests requests please try after some time' })
  @Patch('/changeEmail')
  async changeEmail(@Headers('Authorization') jwtToken:string,@Body() emailDto:ChangeEmailDto){
    try{
      // dto validation
      if(await this.helperfunnction.checkValidatorDto(ChangeEmailDto,emailDto)){
        // token retirve
        const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);

        // verify token
        const currentUser=await this.helperfunnction.currentUser(jwt);

        // check for expiry
        if(await this.client.get("token:"+currentUser['email'])){
          throw new BadGatewayException('Please login to access');
        }

        // check for email match
        if(currentUser['email']!=emailDto.oldEmail){
          throw new BadRequestException('No user of such email exists')
        }

        // chnage mail
        const EmailChanges=await this.usersService.updateUserEmail(emailDto)
        return this.helperfunnction.returnMessage([],200)
      }
    }catch(error){
      throw this.helperfunnction.errorValidator(error)
    }
  }


  @RateLimit({ keyPrefix: 'changePassword', points: 10, duration:60, errorMessage: 'Continuous change passwords requests requests please try after some time' })
  @Patch('/changePassword')
  async changePassword(@Headers('Authorization') jwtToken:string,@Body() passwordDto:ChangePasswordDto){
    try{
      // Dto validation
      if(await this.helperfunnction.checkValidatorDto(ChangePasswordDto,passwordDto)){
        // retrieve jwt
        const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);

        // verify token
        const currentUser=await this.helperfunnction.currentUser(jwt);

        // expiry check
        if(await this.client.get("token:"+currentUser['email'])){
          throw new BadGatewayException('Please login to access');
        }
        
        if(currentUser && await this.helperfunnction.checkPassword(passwordDto.oldPassword,currentUser['password'])){

          // old password actual password match
          if(passwordDto.oldPassword==passwordDto.newPassword){
            throw new BadRequestException('Both old and new passwords are same');
          }
          if(passwordDto.newPassword!=passwordDto.confirmPassword){
            throw new BadRequestException('newPassword and confirmPasswords do not match')
          }

          // Make changes
          const updates=await this.usersService.changePassword(currentUser['email'],passwordDto.newPassword);
          if(updates){
            return this.helperfunnction.returnMessage([],200);
          }
        }
        else{
          throw new UnauthorizedException('Passwords do not match')
        }
      }
    }catch(error){
      
      throw this.helperfunnction.errorValidator(error)
    }
  }

  @Get('/findShopsNearBy')
  async shopFind(@Headers('Authorization') jwtToken:string,@Body() findShop:FindShopsDto){
    try{
      // validate dto
      if(await this.helperfunnction.checkValidatorDto(FindShopsDto,findShop)){

        // get jwt token
        const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);

        // get current user
        const currentUser=await this.helperfunnction.currentUser(jwt);

        // check expiry
        if(await this.client.get("token:"+currentUser['email'])){
          throw new BadGatewayException('Please login to access');
        }

        // code to find shops nearby
        const shopOwnersNearBy=await this.usersService.findNearByShops(currentUser,findShop.phoneNo,findShop.minDistance*1000,findShop.maxDistance*1000);

        return this.helperfunnction.returnMessage(shopOwnersNearBy,200);
        
      }
    }catch(error){
      throw this.helperfunnction.errorValidator(error)
    }
  }

  @HttpCode(200)
  @Get('/findShopOwnersWithConstraints')
  async findShopOwners(@Headers('Authorization') jwtToken:string,@Body('country') country:string,@Body('age') age:number){
    try{
      // get jwt token
      const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);

      // find the current user
      const currentUser=await this.helperfunnction.currentUser(jwt)

      // check for expiry
      if(await this.client.get("token:"+currentUser['email'])){
        throw new BadGatewayException('Please login to access');
      }

      if(age && country && isNumber(age) && isString(country)){

        // get the results
        const result=await this.usersService.findShopOwnersWithConstraints(age,country);
        return this.helperfunnction.returnMessage(result,200);
      }else{
        throw new BadRequestException('Empty or invalid fields of age or country not applicable')
      }
    }catch(error){
      throw this.helperfunnction.errorValidator(error)
    }
  }
}
