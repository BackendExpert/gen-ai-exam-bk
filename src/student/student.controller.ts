import { Body, Controller, Get, Headers, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { StudentService } from "./student.service";
import { JwtAuthGuard } from "src/common/guard/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guard/permissions.guard";
import { Permissions } from "src/common/decorators/permissions.decorator";
import { CreateStudentDTO } from "./dto/student-create.dto";
import { ClientInfoDecorator } from "src/common/decorators/client-info.decorator";
import type { ClientInfo } from "src/common/interfaces/client-info.interface";


@Controller('api/students')
export class StudentController {
    constructor(
        private readonly studentService: StudentService
    ) { }

    @Post('/upload-bulk')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('student:upload-bulk')

    UpdateBulkStundet(
        @Headers("authorization") authHeader: string,
        @Body() dto: CreateStudentDTO[],
        @ClientInfoDecorator() client: ClientInfo,
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.studentService.UploadStundents(
            token,
            dto,
        )
    }

    @Post('/create-student')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('student:create')

    CreateStudent(
        @Headers("authorization") authHeader: string,
        @Body() dto: CreateStudentDTO,
        @ClientInfoDecorator() client: ClientInfo,
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.studentService.CreateStudent(
            token,
            dto,
            client?.ipAddress,
            client?.userAgent
        )
    }

    @Get('/fetch-all')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('student:fetch-all')

    FetchAllStudents(
        @Headers("authorization") authHeader: string,
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.studentService.FetchAllStudents(token)
    }
}