import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    user!: Types.ObjectId;

    @Prop({ type: String, required: true, trim: true })
    full_name!: string;

    @Prop({ type: String, required: true, unique: true, trim: true })
    student_id!: string;

    @Prop({ type: String, required: true, trim: true })
    phone!: string;

    @Prop({ type: String, required: true, trim: true })
    address!: string;

    @Prop({ type: String, enum: ["male", "female", "other"], default: "other" })
    gender!: string;

    @Prop({ type: Date })
    dob!: Date;

    @Prop({ type: String, default: "active", enum: ["active", "inactive", "suspended"] })
    status!: string;

    @Prop({ type: String, trim: true })
    batch!: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);