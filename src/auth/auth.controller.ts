import { BadGatewayException, BadRequestException, Body, Controller, HttpException, HttpStatus, NotFoundException, Post, UnauthorizedException,Headers, UseFilters, ValidationPipe, UsePipes, HttpCode } from '@nestjs/common';
import { HelperFunctions } from 'src/helpers/helper.functions';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from 'src/users/dto/login-dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { RateLimit } from 'nestjs-rate-limiter';


@Controller('auth')
export class AuthController {

    constructor(private usersService:UsersService,private helperfunnction:HelperFunctions,@InjectRedis() private client:Redis){}

    @HttpCode(201)
    @RateLimit({ keyPrefix: 'signUp', points: 10, duration:60, errorMessage: 'Continuos requests to create accounts please try after some time' })
    @Post('signUp')
    // Step1 : Users signup from here    
    async signUp(@Body() createUserDto:CreateUserDto){
      try{
        // Validater to validate the fields
        if(await this.helperfunnction.checkValidatorDto(CreateUserDto,createUserDto)){
            // to create the user
            const user=await this.usersService.create(createUserDto);
            // remove password
            const finalUser=this.helperfunnction.removePassword([user])
            return this.helperfunnction.returnMessage(finalUser,201);
          }
        }
        catch(error){
          throw this.helperfunnction.errorValidator(error)
        }
    }

    @HttpCode(200)
    @Post('login')
    @RateLimit({ keyPrefix: 'login', points: 10, duration:60, errorMessage: 'Continuous signin requests please try after some time' })
    //Step2 : Users login from here
    async login(@Body() loginDetails:LoginDto,@Headers('Authorization') jwtToken:string){
      try{
        
        if(jwtToken){
          // Should not allow the user to login with a aldready existing token
          throw new BadRequestException('User Already signed')
        }

        // Validating the field
        if(await this.helperfunnction.checkValidatorDto(LoginDto,loginDetails)){
          
          const user=await this.helperfunnction.validateUser(loginDetails.email,loginDetails.password);
          
          //user should be present
          if(user && user!=undefined){

            // If the user signed out
            if(await this.client.exists("token:"+loginDetails.email)){
              
              await this.client.del("token:"+loginDetails.email)
            }

            // Creating the access token
            const token=await this.helperfunnction.signInUser(user)
            return this.helperfunnction.returnMessage(token,200)
            
          }
          else{
            throw new NotFoundException('No user of such credentials exists');
          }
      }
    }catch(error){
      throw this.helperfunnction.errorValidator(error)
    }
  }

  @HttpCode(200)
  @Post('/logOutUser')
  async logOut(@Headers('Authorization') jwtToken:string){
    try{
      
      const jwt=this.helperfunnction.GetBearerTokenFromAuthorization(jwtToken);
      const currentUser=await this.helperfunnction.currentUser(jwt);
      const val=await this.usersService.signOutUser(currentUser,jwt)
      return this.helperfunnction.returnMessage([],200);
    }catch(error){
      
      throw this.helperfunnction.errorValidator(error)
    }
  }
}
