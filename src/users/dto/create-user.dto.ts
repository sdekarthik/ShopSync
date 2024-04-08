import { HttpException, UseFilters } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Shop } from "src/schema/shop.schema";
import { CreateShopDto } from "./create-shop.dto";
import { Type } from "class-transformer";


export class CreateUserDto {

        @IsEmail()
        @IsNotEmpty()
        email:string

        @IsString()
        @IsOptional()
        password:string

        @IsNumber()
        age:number

        @IsString()
        country:string

        @IsNotEmpty()
        @ValidateNested()
        @ValidateNested()
        @Type(() => Array<CreateShopDto>)
        shopDetails:Array<CreateShopDto>
    }
