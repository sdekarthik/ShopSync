import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";



export class ChangeEmailDto{
    
    @IsEmail()
    @IsNotEmpty()
    oldEmail:string
    
    @IsEmail()
    @IsNotEmpty()
    newEmail:string
}
