import { Injectable, Logger } from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { messages } from "src/common/helpers/message";
import { toUserProfileDetailResponse } from "./mappers/response-user.mapper";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async userProfileDetail(
    user: User,
  ): Promise<{ success: boolean; message: string; data?: object }> {
    const userDetails = await this.userModel.findById(user._id);

    if (!userDetails) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    return {
      success: true,
      message: "User Profile Fetched",
      data: { user: toUserProfileDetailResponse(userDetails) },
    };
  }

  async deleteCurrentUser(
    user: User,
  ): Promise<{ success: boolean; message: string; data?: object }> {
    const existingUser = await this.userModel
      .findById(user._id)
      .select("+isDeleted");

    if (!existingUser) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    if (existingUser.isDeleted) {
      return {
        success: false,
        message: messages.USER_ALREADY_DELETED,
      };
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      isDeleted: true,
    });

    return {
      success: true,
      message: messages.USER_DELETED_SUCCESSFULLY,
    };
  }
}
