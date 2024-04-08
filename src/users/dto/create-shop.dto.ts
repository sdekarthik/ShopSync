import { HttpException, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { Shop } from "src/schema/shop.schema";

export class CreateShopDto {

    @IsNotEmpty({message:'Must not be empty'})
    @IsString({message:'must be a string'})
    shopName:string
    
    @IsString()
    @IsNotEmpty()
    address:string

    @IsNotEmpty()
    @IsString()
    @IsPhoneNumber()
    phoneNo:string

    /*@IsNotEmpty()
    @ValidateNested()
    coordinates: {
        x: number,
        y: number
    };*/
}
