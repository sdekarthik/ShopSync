import { UsersService } from 'src/users/users.service';
import { BadGatewayException, BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt'
import { codes } from 'src/err.codes';
import { readFileSync } from 'fs';
import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { config } from 'src/config';


@Injectable()
export class HelperFunctions{
    constructor(private usersService:UsersService){}

    returnMessage(msg,statusCode){
        return{
            statusCode,
            message:"success",
            "data":msg
        }
    }

    async checkPassword(userpassword:string,hashPassword:string){
      return await bcrypt.compare(userpassword,hashPassword)
    }

    removePassword(user:any){
        
        user=user.map((user)=>{
            const temp=JSON.parse(JSON.stringify(user))
            delete temp['password']
            return temp
        })
        
        return user
    }

    async checkValidatorDto(dto:any,body:any){

      const requestFields=Object.keys(JSON.parse(JSON.stringify(body)));
      if(requestFields.length==0){
        throw new BadRequestException('Request cannot be empty');
      }

      requestFields.forEach((fieldNames)=>{
        if(!config[dto.name].includes(fieldNames)){
          
          throw new BadRequestException(`No valid field named ${fieldNames}`)
        }
      })


      const userDto = plainToClass(dto, body);
      const errors = await validate(userDto);
      
      if(errors.length>0){
        throw new BadRequestException({'field':errors[0].property});
      }
      let dtoName=dto.name
      if(body['shopDetails'] ){
        if(dto.name!="UpdateUserDto"){
            if(!Array.isArray(body.shopDetails) || body.shopDetails.length==0 || Array.isArray(body.shopDetails[0])){
              throw new BadRequestException('shopDetails must be a valid array and with the required fields')
            }
          
          body.shopDetails.forEach((shopObject)=>{
            Object.keys(shopObject).forEach((keys)=>{
              if(!config.METADATA[dtoName].includes(keys)){
                throw new BadRequestException('shopDetails doesnt contain the field '+keys);
              }
            })
          })
        }else{
          Object.keys(body['shopDetails']).forEach((keys)=>{
            if(!config.METADATA[dtoName].includes(keys)){
              throw new BadRequestException('shopDetails doesnt contain the field '+keys)
            }
          })
        }
      }
      return true
    }

    async validateUser(email:string,password:string){
      try{
        const user=await this.usersService.findOne(email,password);
        
        if(user==undefined || user==null){
          return false
        }
        
        if(await this.checkPassword(password,user.password)){
          
          return this.removePassword([user])
        }
        else{
          return false
        }
      }
      catch(error){
        throw error;
      }
    }

    errorValidator(error){
      
      if(error['errors'] || error['code'] || error['path'] || (error['response'] && error['response']['field'])){
        const code=error.code
        if(code){
          throw new HttpException({ statusCode: HttpStatus.BAD_REQUEST, message: codes[code],data:[] }, HttpStatus.BAD_REQUEST);
        }else{
          if(error['errors']){
              const validationMessage=codes[error['errors'][Object.keys(error.errors)[0]]['path']];
              
              if(validationMessage){
                throw new HttpException({ statusCode: HttpStatus.BAD_REQUEST, message:validationMessage,data:[] }, HttpStatus.BAD_REQUEST);
              }
            }
            else{
              if(error['path']){
                const validationMessage=codes[error['path']];
                if(validationMessage){
                  throw new HttpException({ statusCode: HttpStatus.BAD_REQUEST, message:validationMessage,data:[] }, HttpStatus.BAD_REQUEST);
                }
              }
              else{
                if(error['response'] && codes[error['response']['field']]){
                  throw new HttpException({ statusCode: HttpStatus.BAD_REQUEST ,message: codes[error['response']['field']],data:[]}, HttpStatus.BAD_REQUEST);
                }
              }
            } 
          }
        }else{
          if(error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof ForbiddenException || error instanceof BadGatewayException){
            throw new HttpException({ statusCode: error['status'], message: error.message ,data:[]}, error['status']);
          }else{
            if(error instanceof JsonWebTokenError){
              throw new HttpException({ statusCode: 401, message: 'Invalid token or token expired' ,data:[]}, 401);
            }
          }
        }
        throw new HttpException({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message,data:[]}, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    async signInUser(user){
      try{
        const privateKey=readFileSync('/home/karthikeyan/Documents/HAVELLS/NestJS/havells-project/src/auth/keys/user-private.key','utf-8')
        const userId=user[0]['_id']
        let payload={
          userId,
          scope:'shopOwner'
        }
        const token=await jwt.sign(payload,privateKey,{
          expiresIn:'1d',
          algorithm:'RS256'
        })
        if(!token){
          throw new BadRequestException('Cant create token for such credentials') 
        }
        return token
      }catch(error){
        throw error;
      }
    }

    async currentUser(token:string){
      try{
        if(!token){
          
          throw new UnauthorizedException('Please login before access')
        }
        
        const publicKey=readFileSync('/home/karthikeyan/Documents/HAVELLS/NestJS/havells-project/src/auth/keys/havells-public.key','utf-8')
        const data=await jwt.verify(token,publicKey)
        if(!data){
          throw new UnauthorizedException('Invalid token')
        }
        
        const userId=data['userId']
        const user=await this.usersService.findById(userId)
        return  user;
      }catch(error){
        
        throw error;
      }
    }

    GetBearerTokenFromAuthorization(jwtToken:string){
      try{
        if(!jwtToken){
          throw new JsonWebTokenError('Invalid token');
        }else{
          return jwtToken.substring(7);
        }
      }catch(error){
        throw error
      }
    }
}