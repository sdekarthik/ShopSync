import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";



export class ChangePasswordDto{
    
    @IsString()
    @IsNotEmpty()
    oldPassword:string
    
    @IsString()
    @IsNotEmpty()
    newPassword:string

    @IsString()
    @IsNotEmpty()
    confirmPassword:string
}
