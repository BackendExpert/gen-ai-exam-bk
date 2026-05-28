import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { RoleModule } from "src/role/role.module";
import { User, UserSchema } from "./schema/user.schema";
import { AuditLog, AuditLogSchema } from "src/auditlogs/schema/auditlog.schema";
import { AuthLink, AuthLinkSchema } from "src/auth/schema/authlink.schema";
import { Role, RoleSchema } from "src/role/schema/role.schema";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { EmailService } from "src/common/utils/email.util";

@Module({
    imports: [
        AuthModule,
        RoleModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
            { name: AuthLink.name, schema: AuthLinkSchema },
            { name: Role.name, schema: RoleSchema },
        ])
    ],

    controllers: [UserController],
    providers: [UserService, EmailService],
    exports: [UserService]
})

export class UserModule {}