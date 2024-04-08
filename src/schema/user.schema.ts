import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt'
import { Shop, ShopSchema } from "./shop.schema";
import { IsEmail, ValidateNested } from "class-validator";


@Schema()
export class Users{
    
    @Prop({required:true,unique:true})
    
    email:string

    @Prop({required:true})
    password:string

    @Prop()
    country?:string

    @Prop({min:18,max:120})
    age?:number

    @Prop({required:true,type:[ShopSchema]})
    @ValidateNested()
    shopDetails:[Shop]
}

export type UserDocument=Users & Document

export const UserSchema=SchemaFactory.createForClass(Users)

UserSchema.pre('save',async function(next:Function){
    const userpassword=this.password
    const hashedPassword=await bcrypt.hash(userpassword,10)
    this.password=hashedPassword
    next()
})

export const UserModel=Users.name