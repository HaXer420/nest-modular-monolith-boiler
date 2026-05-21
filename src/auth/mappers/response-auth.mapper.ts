import { User } from "src/user/entities/user.entity";
import {
  AdminSignInResponseDto,
  UserSignInResponseDto,
  UserSignUpResponseDto,
} from "../dto/response-auth.dto";
import { Types } from "mongoose";

export function toUserSignUpResponse(user: User): UserSignUpResponseDto {
  const userObject = user.toObject() as User & {
    _id: Types.ObjectId;
    createdAt: Date;
  };

  return {
    id: userObject._id.toString(),
    email: userObject.email,
    number: userObject.number,
    role: userObject.role.toString(),
    isEmailVerified: Boolean(userObject.isEmailVerified),
    isNumberVerified: Boolean(userObject.isNumberVerified),
    signUpType: userObject.signUpType.toString(),
    createdAt: userObject.createdAt,
  };
}

export function toUserSignInResponse(user: User): UserSignInResponseDto {
  const userObject = user.toObject() as User & {
    _id: Types.ObjectId;
  };

  return {
    id: userObject._id.toString(),
    email: userObject.email,
    number: userObject.number,
    role: userObject.role.toString(),
    isEmailVerified: Boolean(userObject.isEmailVerified),
    isNumberVerified: Boolean(userObject.isNumberVerified),
    signUpType: userObject.signUpType.toString(),
  };
}

export function toAdminSignInResponse(user: User): AdminSignInResponseDto {
  const userObject = user.toObject() as User & {
    _id: Types.ObjectId;
  };

  return {
    id: userObject._id.toString(),
    email: userObject.email,
    role: userObject.role.toString(),
    isEmailVerified: Boolean(userObject.isEmailVerified),
    signUpType: userObject.signUpType.toString(),
  };
}
