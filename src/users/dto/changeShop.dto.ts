import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import { Transform } from "class-transformer";
import { IsObject, IsOptional, IsString, ValidateNested } from "class-validator";



export class ChangeShopDto{
    
    @IsString()
    @IsOptional()
    shopName?:string
    
    @IsString()
    @IsOptional()
    address?:string

    @IsString()
    @IsOptional()
    
    phoneNo?:string

    @IsString()
    @IsOptional()
    newPhoneNo?:string

    @IsObject()
    @IsOptional()
    @ValidateNested()
    coordinates?: {
        x: number,
        y: number
    };
}
