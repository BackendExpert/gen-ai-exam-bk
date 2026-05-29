import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateStudentDTO {
    @IsNotEmpty()
    @IsString()
    full_name!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    nic_no!: string;

    @IsNotEmpty()
    @IsString()
    student_id!: string;

    @IsNotEmpty()
    @IsString()
    phone!: string;

    @IsNotEmpty()
    @IsString()
    address!: string;

    @IsOptional()
    @IsEnum(["male", "female", "other"])
    gender?: string;

    @IsOptional()
    dob?: Date;

    @IsOptional()
    @IsString()
    batch?: string;
}