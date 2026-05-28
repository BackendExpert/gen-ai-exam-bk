import { IsString } from "class-validator";

export class VerifyLink{
    @IsString()
    email!: string

    @IsString()
    token!: string    
}