import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "src/common/guard/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guard/permissions.guard";
import { Permissions } from "src/common/decorators/permissions.decorator";
import { ClientInfoDecorator } from "src/common/decorators/client-info.decorator";
import type { ClientInfo } from "src/common/interfaces/client-info.interface";

@Controller('api/user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post('/create-user')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('user:create')

    CreateNewUser(
        @Headers("authorization") authHeader: string,
        @Body() body: { email: string; role: string },
        @ClientInfoDecorator() client: ClientInfo
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }

        const token = authHeader.split(" ")[1];

        return this.userService.CreateUserAccount(
            token,
            body.email,
            body.role,
            client?.ipAddress,
            client?.userAgent
        );
    }


    @Get('/fetch-all')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('user:fetch-all')

    FetchAllUsers(
        @Headers("authorization") authHeader: string,
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }

        const token = authHeader.split(" ")[1];

        return this.userService.FetchAllUsers(token)
    }

    @Get('/fetch/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('user:fetch-by-id')

    FetchUserById(
        @Headers("authorization") authHeader: string,
        @Param('id') id: string,
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }

        const token = authHeader.split(" ")[1];

        return this.userService.FetchUserById(token, id)
    }

    @Patch('/update/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('user:udpate')

    UdpateUser(
        @Headers("authorization") authHeader: string,
        @Param('id') id: string,
        @Body() body: { role: string; account_stats: boolean },
        @ClientInfoDecorator() client: ClientInfo
    ) {

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.userService.UdpateUserInfo(
            token,
            id,
            body.role,
            body.account_stats,
            client?.ipAddress,
            client?.userAgent
        )
    }

    @Get('/fetch-role')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('roles:fetch-all')

    FetchAllRoles(
        @Headers("authorization") authHeader: string,
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.userService.FetchAllRoles(token)

    }


    @Get('/fetch-role-byid/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('roles:fetch-role')

    FetchRole(
        @Headers("authorization") authHeader: string,
        @Param('id') id: string
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.userService.FetchRoleByID(token, id)
    }

    @Patch('/update-role/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('roles:update')

    AddPermissionstoRole(
        @Headers("authorization") authHeader: string,
        @Param('id') id: string,
        @Body('permission') permission: string
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.userService.UpdatePermissions(token, id, permission)
    }

    @Delete('/delete-permission/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('roles:delete-permission')

    DeletePermission(
        @Headers("authorization") authHeader: string,
        @Param('id') id: string,
        @Body('permission') permission: string
    ) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid or missing token");
        }
        const token = authHeader.split(" ")[1];

        return this.userService.DeletePermission(token, id, permission)
    }

    // @Post('/create-role')
    // @UseGuards(JwtAuthGuard, PermissionsGuard)
    // @Permissions('roles:create')

    // CreateRole(
    //     @Headers("authorization") authHeader: string,
    //     @Body('role') role: string
    // ) {
    //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //         throw new UnauthorizedException("Invalid or missing token");
    //     }
    //     const token = authHeader.split(" ")[1];

    //     return this.userService.CreateNewRole(token, role)

    // }

}
