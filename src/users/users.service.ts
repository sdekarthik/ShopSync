import { MongoServerError } from 'mongodb';
import { BadGatewayException, BadRequestException, HttpException, HttpStatus, Inject, Injectable, MethodNotAllowedException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, UserModel } from 'src/schema/user.schema';
import mongoose, { Model, Mongoose, MongooseError } from 'mongoose';
import { Users } from 'src/schema/user.schema';
import * as bcrypt from 'bcrypt'
import axios from 'axios';
import { ChangeEmailDto } from './dto/change-email.dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class UsersService {

  constructor(@InjectModel(UserModel) private userModel:Model<UserDocument>,@InjectRedis() private readonly client: Redis ){ 
    console.log(userModel)
    
  }

  async updateUserEmail(emailDto:ChangeEmailDto){
    try{
      const updates=await this.userModel.findOneAndUpdate({email:emailDto.oldEmail},{$set:{email:emailDto.newEmail}})
      if(await this.client.exists(emailDto.oldEmail)){
        await this.client.del(emailDto.oldEmail)
        await this.client.set(emailDto.newEmail,JSON.stringify(updates),'EX',86400);
      }
      return updates
    }catch(error){
      throw error
    }
  }
  
  async checkshopPhoneNoMatch(phoneNo:String){

    const projection={_id:0}
    const users=await this.userModel.find( { 'shopDetails.phoneNo': phoneNo },projection)
    if(users.length!=0){
      return true;
    }
    return false;
  }

  async create(createUserDto: CreateUserDto){
    try{
      let checkShopPhoneNoUnique=true;
      
      const previousPhoneNumbers=new Map<string,number>;

      for(let i=0;i<createUserDto.shopDetails.length;i++){
        const phoneNo=createUserDto.shopDetails[i]['phoneNo'];
        if(await this.checkshopPhoneNoMatch(phoneNo) || previousPhoneNumbers.get(phoneNo)){
          checkShopPhoneNoUnique=false
          break;
        }else{
          previousPhoneNumbers.set(phoneNo,1);
        }
      }
      if(checkShopPhoneNoUnique){
        for(let i=0;i<createUserDto.shopDetails.length;i++){
          const query="https://api.geoapify.com/v1/geocode/search?text="+createUserDto.shopDetails[i].address+"&apiKey=<apiKey>";
          const ans=await axios.get(query)
          if(!ans || ans.data['features'].length==0){
            throw new BadRequestException('Enter proper address')
          }
          const lat=ans.data['features'][0]['properties']['lat']
          const lon=ans.data['features'][0]['properties']['lon']
          
          createUserDto.shopDetails[i]['coordinates']={
            "x":lat,
            "y":lon
          }
        }
        const user=await this.userModel.create(createUserDto);
        await this.client.set(`${user.email}`,JSON.stringify(user),'EX',3600);
        
        return user
      }
      else{
        throw new BadRequestException('User of same shop phone number already exists or using 2 shops of same phone umber')
      }
    }catch(error){
      throw error;
    }
  }

  async findAll() {
    try{
      
      const users=await this.userModel.find();
      if(users.length==0){
        throw new NotFoundException('No user found')
      }
      return users
    }catch(error){
      throw error
    }
  }
  
  async findOne(email: string,password:string) {
    try{
      
      let redisFindUser:string|undefined=await this.client.get(`${email}`);
      if(redisFindUser){
        
        return JSON.parse(redisFindUser);
        
      }
      const user=await this.userModel.findOne({email});
      if(!user){
        throw new NotFoundException('No user found of this email')
      }
      await this.client.set(`${email}`,JSON.stringify(user),'EX',3600);     
      return user
    }catch(error){
      throw error;
    }
  }

  async findById(id:string){
      const userId=new mongoose.Types.ObjectId(id)
      const user=await this.userModel.findById(userId);
      return user;
  }

  async update(currentUser:Users,updateUserValues: UpdateUserDto){
    
    try{
      
      let updateCount=0;
      const email=currentUser['email']
      let user=currentUser;
      if(updateUserValues.shopDetails){

        // shopDetails to be a array and not nested array
        if(Array.isArray(updateUserValues.shopDetails)){
          throw new BadRequestException('shopDetails must be a valid object')
        }
        let checkValidShop=false,counter=0;

        // this checks if some shop matches the phoneNo of the shop provided in updateUser
        for(let i=0;i<user.shopDetails.length;i++){
          if(user.shopDetails[i].phoneNo==updateUserValues.shopDetails.phoneNo){
            checkValidShop=true;
            break;
          }
          else{
            counter++;
          }
        }


        if(checkValidShop){ // if the shop matches with phoneNo

          if(updateUserValues.shopDetails.newPhoneNo){
            if(await this.checkshopPhoneNoMatch(updateUserValues.shopDetails.newPhoneNo)){
              throw new BadRequestException('Shop with same phoneNo already exists');
            }

          }
        
        }else{
          throw new BadRequestException(`phoneNo not provided or does not match with any of your shop`)
        }
        
        const userObject=Object.keys(JSON.parse(JSON.stringify(user.shopDetails[counter])))
        

        for(let keys of userObject){
          // iterating on the update keys
            if(keys in updateUserValues.shopDetails){

              if(keys!='phoneNo' && keys!='address'){
                updateCount++;
                // directly updating the value
                user.shopDetails[counter][keys]=updateUserValues.shopDetails[keys]
              }else{
                // if phoneNo then update with newPhoneNo
                if(keys=='phoneNo' && ('newPhoneNo' in updateUserValues.shopDetails)){
                  user.shopDetails[counter].phoneNo=updateUserValues.shopDetails.newPhoneNo
                  updateCount++;
                }
                if(keys=="address" && ('address' in updateUserValues.shopDetails)){
                  user.shopDetails[counter].address=updateUserValues.shopDetails.address
                  const query="https://api.geoapify.com/v1/geocode/search?text="+updateUserValues.shopDetails.address+"&apiKey=22d2403e7c844c3ba6bee009c4deed6f";
                  const ans=await axios.get(query)
                  if(!ans || ans.data['features'].length==0){
                    throw new BadRequestException('Enter proper address')
                  }
                  const lat=ans.data['features'][0]['properties']['lat']
                  const lon=ans.data['features'][0]['properties']['lon']
                  updateCount++;
                  user.shopDetails[counter].coordinates={
                    "x":lat,
                    "y":lon
                  }
                }
              }
            }
          }
        

        if(updateCount==0){
          throw new BadRequestException("No field provided to update in shopDetails");
        }
      }else{
        const userObject=JSON.parse(JSON.stringify(user))
        for(let keys in userObject){
          if(keys in updateUserValues){
            user[keys]=updateUserValues[keys]
            updateCount++
          }
        }
      }
      
      if(updateCount==0){
        throw new BadRequestException('Cannot update any of the fields')
      }
      await this.userModel.findOneAndUpdate({email},{$set:user})
      await this.client.set(`${email}`,JSON.stringify(user),'EX',3600);
        
      return user
      
    }
    catch(error){
      
      throw error
    }
  }

  async remove(email: string){

    const numberOfDeletedFiles=await this.userModel.deleteOne({email})
    if(await this.client.exists(`${email}`)){
      await this.client.del(`${email}`)
    }
    return numberOfDeletedFiles
  }

  async changePassword(email:string,newPassword:string){
    const hashedPwd=await bcrypt.hash(newPassword,10);
    const updates=await this.userModel.findOneAndUpdate({email},{$set:{password:hashedPwd}});
    const changedUser=await this.userModel.findOne({email});
    await this.client.set(`${email}`,JSON.stringify(changedUser),'EX',3600);
    
    return updates;    
  }

  async findNearByShops(currentUser:Users,phoneNo:string,mindistance:number,maxDistance){
    try{

      let userShop=currentUser.shopDetails.find((shop)=>{return shop.phoneNo==phoneNo})
      
      let nearByShops=await this.userModel.find({"shopDetails.coordinates":{$near:{$geometry:{type:"Point",coordinates:[userShop.coordinates.x,userShop.coordinates.y]},$maxDistance:maxDistance,$minDistance:mindistance}}},{password:0,__v:0})
      return nearByShops
      
    }catch(error){
      throw error
    }
  }

  async findShopOwnersWithConstraints(age:number,country:string){
    let keyToFindFromRedis=String(age)+country
    const result=await this.client.get(keyToFindFromRedis);
    
    if(!result){
      
      const shopOwnersWithConstraints=await this.userModel.find({$and:[{age},{country}]},{__v:0,password:0})
      await this.client.set(keyToFindFromRedis,JSON.stringify(shopOwnersWithConstraints),'EX',3600)
      return shopOwnersWithConstraints
    }
    
    return JSON.parse(result)
  }

  async signOutUser(currentUser,jwtToken:string){
    try{
      if(await this.client.exists("token:"+currentUser['email'])){
        throw new BadRequestException('Invalid request')
      }
      await this.client.set("token:"+currentUser['email'],jwtToken,'EX',86400)
      
    }catch(error){
      
      throw error
    }
  }
}

