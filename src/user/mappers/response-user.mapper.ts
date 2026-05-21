import { Types } from "mongoose";
import { UserRoleEnum } from "src/common/helpers/enums";
import { User } from "../entities/user.entity";
import { UserProfileDetailResponseDto } from "../dto/profile-detail.dto";

export function toUserProfileDetailResponse(
  user: User,
): UserProfileDetailResponseDto {
  const userObject = user.toObject() as User & {
    _id: Types.ObjectId;
    createdAt: Date;
  };

  const baseResponse: UserProfileDetailResponseDto = {
    id: userObject._id.toString(),
    email: userObject.email,
    number: userObject.number,
    role: userObject.role.toString(),
    isEmailVerified: Boolean(userObject.isEmailVerified),
    isNumberVerified: Boolean(userObject.isNumberVerified),
    signUpType: userObject.signUpType.toString(),
    isProfileSetup: Boolean(userObject.isProfileSetup),
    createdAt: userObject.createdAt,
    profile: {
      image: userObject.profile?.image,
      firstName: userObject.profile?.firstName,
      lastName: userObject.profile?.lastName,
    },
  };

  return baseResponse;
}
