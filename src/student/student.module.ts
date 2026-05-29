import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditLog, AuditLogSchema } from "src/auditlogs/schema/auditlog.schema";
import { AuthModule } from "src/auth/auth.module";
import { RoleModule } from "src/role/role.module";
import { Role, RoleSchema } from "src/role/schema/role.schema";
import { User, UserSchema } from "src/user/schema/user.schema";
import { Student, StudentSchema } from "./schema/student.schema";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { EmailService } from "src/common/utils/email.util";
import { AuthLink, AuthLinkSchema } from "src/auth/schema/authlink.schema";

@Module({
    imports: [
        AuthModule,
        RoleModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
            { name: Role.name, schema: RoleSchema }, 
            { name: Student.name, schema: StudentSchema },
            { name: AuthLink.name, schema: AuthLinkSchema }
        ])
    ],
    controllers: [StudentController],
    providers: [StudentService, EmailService],
    exports: [StudentService]
})

export class StudentModule {}