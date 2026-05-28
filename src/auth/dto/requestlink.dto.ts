import { IsEmail } from "class-validator";

export class ReqeustLink {
    @IsEmail()
    email!: string;
}