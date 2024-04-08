import { IsNotEmpty, IsNumber, isNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class FindShopsDto{
    
    @IsString()
    @IsNotEmpty()
    phoneNo:string
    
    @IsNumber()
    @IsNotEmpty()
    minDistance:number

    @IsNumber()
    @IsNotEmpty()
    maxDistance:number
}
