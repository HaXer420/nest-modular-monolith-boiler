import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { User } from "./entities/user.entity";
import { GetFullUser } from "src/common/decorators/get-full-user.decorator";
import { Request, Response } from "express";
import {
  DeleteCurrentUserSwagger,
  ProfileDetailsSwagger,
  UserTag,
} from "./user.swagger";

@UserTag()
@Controller({ version: "1", path: "user" })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly responseHandler: ResponseHandler,
  ) {}

  @Get("profile-details")
  @ProfileDetailsSwagger()
  async profileDetails(
    @GetFullUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const result = await this.userService.userProfileDetail(user);
      if (result.success) {
        return this.responseHandler.successResponseWithData(
          res,
          result.message,
          result.data,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      console.log("Error in profileDetails", error);
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Delete("me")
  @DeleteCurrentUserSwagger()
  async deleteCurrentUser(@GetFullUser() user: User, @Res() res: Response) {
    try {
      const result = await this.userService.deleteCurrentUser(user);
      if (result.success) {
        return this.responseHandler.successResponse(res, result.message);
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      console.log("Error in deleteCurrentUser", error);
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }
}
