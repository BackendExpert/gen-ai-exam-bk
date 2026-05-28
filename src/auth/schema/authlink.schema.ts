import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AuthLinkDocument = AuthLink & Document;

@Schema({ timestamps: true })

export class AuthLink {
    @Prop({
        required: true,
        index: true,
        lowercase: true,
        trim: true,
    })
    email!: string;

    @Prop({
        required: true,
        unique: true,
    })
    tokenHash!: string;

    @Prop({
        required: true,
        expires: 0,
    })
    expiresAt!: Date;

    @Prop({
        default: false,
    })
    used!: boolean;

    @Prop()
    ipAddress?: string;

    @Prop()
    userAgent?: string;
}

export const AuthLinkSchema = SchemaFactory.createForClass(AuthLink)