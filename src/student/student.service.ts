import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuditLog, AuditLogDocument } from "src/auditlogs/schema/auditlog.schema";
import { Role, RoleDocument } from "src/role/schema/role.schema";
import { User, UserDocument } from "src/user/schema/user.schema";
import { Student, StudentDocument } from "./schema/student.schema";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { EmailService } from "src/common/utils/email.util";
import { CreateStudentDTO } from "./dto/student-create.dto";
import { AuthLink, AuthLinkDocument } from "src/auth/schema/authlink.schema";
import { GenerateAuthLink } from "src/common/utils/authlink.util";
import { createAuditLog } from "src/common/utils/auditlogs.util";


@Injectable()
export class StudentService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        @InjectModel(AuditLog.name)
        private readonly auditlogModel: Model<AuditLogDocument>,

        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,

        @InjectModel(Student.name)
        private readonly studentModel: Model<StudentDocument>,

        @InjectModel(AuthLink.name)
        private readonly authlinkModel: Model<AuthLinkDocument>,

        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService
    ) { }

    async UploadStundents(
        token: string,
        dto: CreateStudentDTO[],
        ipAddress?: string,
        userAgent?: string,
    ) {

        const payload = await this.jwtService.verify(token)

        const user = await this.userModel.findOne({
            email: payload.email
        })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const getroleid = await this.roleModel.findOne({
            role: 'student'
        })

        if (!getroleid) {
            throw new NotFoundException("Student Role Cannot be Found")
        }

        const insertedStudents: Student[] = []

        const skippedStudents: {
            student_id: string
            nic_no: string
            email: string
            reason: string
        }[] = []

        for (const student of dto) {

            const checkstd = await this.studentModel.findOne({
                $or: [
                    { nic_no: student.nic_no },
                    { student_id: student.student_id }
                ]
            })

            if (checkstd) {

                skippedStudents.push({
                    student_id: student.student_id,
                    nic_no: student.nic_no,
                    email: student.email,
                    reason: "Student already exists"
                })

                continue
            }

            const checkUserEmail = await this.userModel.findOne({
                email: student.email
            })

            if (checkUserEmail) {

                skippedStudents.push({
                    student_id: student.student_id,
                    nic_no: student.nic_no,
                    email: student.email,
                    reason: "Email already exists"
                })

                continue
            }

            const createUser = await this.userModel.create({
                email: student.email,
                role: getroleid._id,
                account_stats: false,
                login_ip: "0.0.0.0"
            })

            await this.authlinkModel.deleteMany({
                email: student.email
            })

            const authlink = GenerateAuthLink()

            await this.authlinkModel.create({
                email: student.email,
                tokenHash: authlink.authLink,
                expiresAt: authlink.expiresAt,
                ipAddress: ipAddress || "0.0.0.0",
                userAgent: userAgent || "Unknown Device"
            })

            await this.emailService.sendOTP(
                student.email,
                authlink.authLink,
                ipAddress || "0.0.0.0",
                userAgent || "Unknown Device"
            )

            const createstudent = await this.studentModel.create({
                user: createUser._id,
                full_name: student.full_name,
                nic_no: student.nic_no,
                student_id: student.student_id,
                phone: student.phone,
                address: student.address,
                gender: student.gender || "other",
                dob: student.dob,
                batch: student.batch
            })

            insertedStudents.push(createstudent)
        }

        return {
            success: true,
            message: "Student Upload Process Completed",
            inserted_count: insertedStudents.length,
            skipped_count: skippedStudents.length,
            inserted_students: insertedStudents,
            skipped_students: skippedStudents
        }
    }

    async CreateStudent(
        token: string,
        dto: CreateStudentDTO,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const getroleid = await this.roleModel.findOne({
            role: 'student'
        })

        if (!getroleid) {
            throw new NotFoundException("Student Role Cannot be Found")
        }


        const checkstd = await this.studentModel.findOne({
            $or: [
                { nic_no: dto.nic_no },
                { student_id: dto.student_id }
            ]
        })

        if (checkstd) {
            throw new ConflictException("This Student Already Registed in the System")
        }

        const checkUserEmail = await this.userModel.findOne({
            email: dto.email
        })

        if (checkUserEmail) {
            throw new ConflictException("This User Already Registed in the System")
        }

        const createUser = await this.userModel.create({
            email: dto.email,
            role: getroleid._id,
            account_stats: false,
            login_ip: "0.0.0.0"
        })

        await this.authlinkModel.deleteMany({
            email: dto.email
        })

        const authlink = GenerateAuthLink()

        await this.authlinkModel.create({
            email: dto.email,
            tokenHash: authlink.authLink,
            expiresAt: authlink.expiresAt,
            ipAddress: ipAddress || "0.0.0.0",
            userAgent: userAgent || "Unknown Device"
        })


        await this.emailService.sendOTP(
            dto.email,
            authlink.authLink,
            ipAddress || "0.0.0.0",
            userAgent || "Unknown Device"
        )

        const createstudent = await this.studentModel.create({
            user: createUser._id,
            full_name: dto.full_name,
            nic_no: dto.nic_no,
            student_id: dto.student_id,
            phone: dto.phone,
            address: dto.address,
            gender: dto.gender || "other",
            dob: dto.dob,
            batch: dto.batch
        })

        await createAuditLog(this.auditlogModel, {
            user: user._id,
            action: "STUDENT_CREATED_SUCCESS",
            description: `${user.email} Create new Student`,
            ipAddress,
            userAgent,
            metadata: { ipAddress, userAgent }
        });


        return {
            success: true,
            message: "Student Upload Process Completed",
        }

    }

    async FetchAllStudents(
        token: string
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const fetchstds = await this.studentModel.find().populate('user')

        return {
            success: true,
            message: "Student Upload Process Completed",
            result: fetchstds,
        }

    }
}