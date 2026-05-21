import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { actionSwitches } from "src/common/helpers/action.helper";
import { ActionEnum, UserRoleEnum } from "src/common/helpers/enums";
import { messages } from "src/common/helpers/message";
import { User } from "src/user/entities/user.entity";
import { toUserProfileDetailResponse } from "src/user/mappers/response-user.mapper";
import { SetupProfileDto } from "./dto/setup-profile.dto";

@Injectable()
export class OnboardingService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async setupProfile(
    user: User,
    dto: SetupProfileDto,
  ): Promise<{
    success: boolean;
    message: string;
    data?: object;
    action?: ActionEnum;
  }> {
    const userDetails = await this.userModel.findById(user._id);

    if (!userDetails) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    if (dto.number && dto.number !== userDetails.number) {
      const existingUser = await this.userModel.findOne({
        number: dto.number,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return {
          success: false,
          message: "User with given number already exists",
        };
      }

      userDetails.number = dto.number;
    }

    userDetails.profile = {
      image: dto.image,
      firstName: dto.firstName,
      lastName: dto.lastName,
    };
    userDetails.isProfileSetup = true;

    await userDetails.save();

    return {
      success: true,
      message: "Profile setup successfully",
      data: { user: toUserProfileDetailResponse(userDetails) },
      action: actionSwitches(userDetails),
    };
  }
}
