import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";

import { AuditLog, AuditLogDocument } from "src/auditlogs/schema/auditlog.schema";
import { Role, RoleDocument } from "src/role/schema/role.schema";
import { User, UserDocument } from "src/user/schema/user.schema";
import { AuthLink, AuthLinkDocument } from "./schema/authlink.schema";

import { EmailService } from "src/common/utils/email.util";
import { GenerateAuthLink, CompareAuthToken } from "src/common/utils/authlink.util";
import { getLocationFromIP } from "src/common/utils/location";
import { createAuditLog } from "src/common/utils/auditlogs.util";

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,

        @InjectModel(Role.name)
        private roleModel: Model<RoleDocument>,

        @InjectModel(AuditLog.name)
        private auditlogModel: Model<AuditLogDocument>,

        @InjectModel(AuthLink.name)
        private authlinkModel: Model<AuthLinkDocument>,

        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    async CreateLoginLink(
        email: string,
        ipAddress?: string,
        userAgent?: string,
    ) {
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

        let user = await this.userModel.findOne({ email });

        const userrole = await this.roleModel.findOne({
            role: "viewer",
        });

        if (!userrole) {
            throw new NotFoundException("User role not found");
        }

        const location = getLocationFromIP(ipAddress || "");

        if (!user) {
            const safeIP = String(ipAddress || "0.0.0.0");

            user = await this.userModel.create({
                email,
                role: userrole._id,
                login_ip: safeIP,
                last_login: new Date(),
                account_stats: true,
            });

            await createAuditLog(this.auditlogModel, {
                user: user._id,
                action: "REGISTER_MAGIC_LINK_SENT",
                description: `Registration magic link sent to ${user.email}`,
                ipAddress,
                userAgent,
                metadata: {
                    ipAddress,
                    userAgent,
                    location,
                },
            });
        } else {
            await createAuditLog(this.auditlogModel, {
                user: user._id,
                action: "LOGIN_MAGIC_LINK_SENT",
                description: `Login magic link sent to ${user.email}`,
                ipAddress,
                userAgent,
                metadata: {
                    ipAddress,
                    userAgent,
                    location,
                },
            });
        }

        await this.emailService.sendOTP(
            email,
            authlink.authLink,
            ipAddress,
            userAgent,
        );

        return {
            success: true,
            message: "If the email is valid, a login link has been sent.",
        };
    }

    async verifyAuthLink(
        token: string,
        ipAddress?: string,
        userAgent?: string,
    ) {

        const authlink = await this.authlinkModel.findOne({
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!authlink) {
            throw new ConflictException("Invalid or expired auth link");
        }

        const isValidToken = CompareAuthToken(
            token,
            authlink.tokenHash,
        );

        if (!isValidToken) {
            throw new ConflictException("Invalid or expired auth link");
        }

        const user = await this.userModel
            .findOne({ email: authlink.email })
            .populate("role");

        if (!user) {
            throw new NotFoundException("User not found");
        }

        authlink.used = true;
        await authlink.save();

        user.last_login = new Date();

        if (ipAddress) {
            user.login_ip = ipAddress;
        }

        await user.save();

        const accessToken = await this.jwtService.signAsync({
            sub: user._id,
            email: user.email,
            role: (user.role as any)?.role,
        });

        const location = getLocationFromIP(ipAddress || "");

        await createAuditLog(this.auditlogModel, {
            user: user._id,
            action: "LOGIN_SUCCESS",
            description: "User logged in successfully via magic link",
            ipAddress,
            userAgent,
            metadata: {
                ipAddress,
                userAgent,
                location,
            },
        });

        await this.emailService.NotificationEmail(
            authlink.email,
            "Login Success",
            ipAddress,
            userAgent,
        )

        return {
            success: true,
            accessToken,
            user,
        };
    }
}