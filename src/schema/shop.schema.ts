import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, MaxLength, MinLength, ValidateNested } from "class-validator";


@Schema()
export class Shop{

    
    @Prop({required:true})
    
    shopName:string
    
    @Prop({required:true})
    address:string

    @Prop({required:true,minlength:10,maxlength:10})
    
    phoneNo:string

    @Prop({required:true,type:Object})
    coordinates: {
        x: number,
        y: number
    };
}

export type shopDocument=Shop & Document

export const ShopSchema=SchemaFactory.createForClass(Shop)

export const ShopModel=Shop.name
