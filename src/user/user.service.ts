import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "./schema/user.schema";
import { Model } from "mongoose";
import { Role, RoleDocument } from "src/role/schema/role.schema";
import { AuditLog, AuditLogDocument } from "src/auditlogs/schema/auditlog.schema";
import { AuthLink, AuthLinkDocument } from "src/auth/schema/authlink.schema";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "src/common/utils/email.util";
import { JwtService } from "@nestjs/jwt";
import { GenerateAuthLink } from "src/common/utils/authlink.util";
import { createAuditLog } from "src/common/utils/auditlogs.util";

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,

        @InjectModel(AuditLog.name)
        private readonly auditlogModel: Model<AuditLogDocument>,

        @InjectModel(AuthLink.name)
        private readonly authlinkModel: Model<AuthLinkDocument>,

        private readonly configService: ConfigService,
        private emailService: EmailService,
        private jwtService: JwtService
    ) { }

    async CreateUserAccount(
        token: string,
        email: string,
        role: string,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const checkuser = await this.userModel.findOne({ email: email })
        if (checkuser) {
            throw new ConflictException("User Already Registated")
        }

        const getroleid = await this.roleModel.findOne({ role: role })

        if (!getroleid) {
            throw new NotFoundException("Role Cannot be Found...")
        }

        const createUser = await this.userModel.create({
            email: email,
            role: getroleid._id,
            account_stats: false,
            login_ip: '0.0.0.0'
        })

        await this.authlinkModel.deleteMany({
            email,
        });

        const authlink = GenerateAuthLink();

        await this.authlinkModel.create({
            email,
            tokenHash: authlink.tokenHash,
            expiresAt: authlink.expiresAt,
            ipAddress,
            userAgent,
            used: false,
        });

        await this.emailService.sendOTP(
            email,
            authlink.authLink,
            ipAddress,
            userAgent,
        );

        await createAuditLog(this.auditlogModel, {
            user: user._id,
            action: "USER_ACCOUNT_CREATED",
            description: `User Account ${email} created by Admin`,
            ipAddress,
            userAgent,
            metadata: { ipAddress, userAgent }
        });

        return {
            success: true,
            message: "User Created Success",
        };
    }

    async FetchAllUsers(token: string) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const fetchallusers = await this.userModel.find().populate('role')

        return {
            success: true,
            message: "All Users Fetched Success",
            result: fetchallusers
        }
    }

    async FetchUserById(
        token: string,
        id: string
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const fetchuser = await this.userModel.findById(id).populate('role')

        if (!fetchuser) {
            throw new NotFoundException("User Not Found")
        }

        return {
            success: true,
            message: "All Users Fetched Success",
            result: fetchuser
        }
    }

    async UdpateUserInfo(
        token: string,
        id: string,
        role?: string,
        account_stats?: boolean,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }


        const targetUser = await this.userModel.findById(id)


        if (!targetUser) {
            throw new NotFoundException("Target User Not Found")
        }

        let getroleid: any = null

        if (role) {
            getroleid = await this.roleModel.findOne({ role: role })

            if (!getroleid) {
                throw new NotFoundException("Role cannot be found")
            }
        }

        const updateData: any = {}

        if (role && role.trim() !== "") {
            updateData.role = getroleid._id
        }

        if (typeof account_stats === "boolean") {
            updateData.account_stats = account_stats
        }

        const updateuse = await this.userModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        )

        await createAuditLog(this.auditlogModel, {
            user: user._id,
            action: "USER_ACCOUNT_UPDATED",
            description: `User Account ${targetUser.email} updated by ${user.email}`,
            ipAddress,
            userAgent,
            metadata: { ipAddress, userAgent }
        });

        return {
            success: true,
            message: "User Updated Successfully",
        }

    }

    async FetchAllRoles(
        token: string,
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const fetchroles = await this.roleModel.find()

        return {
            success: true,
            message: "All Role Fetched Success",
            result: fetchroles
        }
    }

    async FetchRoleByID(
        token: string,
        id: string
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const fetchrolebyid = await this.roleModel.findById(id)

        if (!fetchrolebyid) {
            throw new NotFoundException("Role cannot be found")
        }

        return {
            success: true,
            message: "Role Fetched Success",
            result: fetchrolebyid
        }
    }

    async UpdatePermissions(
        token: string,
        id: string,
        permissions: string
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const checkrole = await this.roleModel.findById(id)

        if (!checkrole) {
            throw new NotFoundException("Role cannot found")
        }

        const updaterole = await this.roleModel.findByIdAndUpdate(
            id,
            {
                $addToSet: {
                    permissions: permissions
                }
            },
            {
                new: true,
                returnDocument: 'after'
            }
        )

        return {
            success: true,
            message: "Role Updated Success",
        }
    }

    async DeletePermission(
        token: string,
        id: string,
        permission: string
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const checkrole = await this.roleModel.findById(id)

        if (!checkrole) {
            throw new NotFoundException("Role cannot found")
        }

        const deletePermission = await this.roleModel.findByIdAndUpdate(
            id,
            {
                $pull: {
                    permissions: permission
                }
            },
            {
                returnDocument: 'after'
            }
        );


        return {
            success: true,
            message: "Permission Deleted Successfully",
        };
    }

    async ClearAuthLink(
        token: string,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const payload = await this.jwtService.verify(token)
        const user = await this.userModel.findOne({ email: payload.email })

        if (!user) {
            throw new NotFoundException("The User Not Found")
        }

        const clearAuthLink = await this.authlinkModel.deleteMany({});

        await createAuditLog(this.auditlogModel, {
            user: user._id,
            action: "AUTHLINK_CLEARED",
            description: `Super Admin ${user.email} Clear the AuthLink Table`,
            ipAddress,
            userAgent,
            metadata: { ipAddress, userAgent }
        });

        return {
            success: true,
            message: "Auth Link table Clear"
        }
    }

    // async CreateNewRole(
    //     token: string,
    //     role: string
    // ) {
    //     const payload = await this.jwtService.verify(token)
    //     const user = await this.userModel.findOne({ email: payload.email })

    //     if (!user) {
    //         throw new NotFoundException("The User Not Found")
    //     }

    //     const checkrole = await this.roleModel.findOne({ role: role })

    //     if(checkrole) {
    //         throw new ConflictException("The Role Already Registed")
    //     }

    //     const createRole = await this.roleModel.create({
    //         role: role
    //     })

    //     return {
    //         success: true,
    //         message: "New Role Created Success"
    //     }
    // }
}