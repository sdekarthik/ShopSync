import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { ChangeShopDto } from "./changeShop.dto";
import { Type } from "class-transformer";


export class UpdateUserDto {

    @IsNumber()
    @IsOptional()
    @Min(18)
    @Max(150)
    age?:number

    @IsString()
    @IsOptional()
    country?:string

    @IsOptional()
    @ValidateNested()
    @ValidateNested()
    shopDetails?:ChangeShopDto

}
