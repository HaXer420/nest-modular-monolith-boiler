import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { LoginTypeEnum, UserRoleEnum } from "src/common/helpers/enums";

@Schema({ _id: false })
export class UserProfile {
  @Prop({ default: "", trim: true })
  image?: string;

  @Prop({ default: "", trim: true })
  firstName?: string;

  @Prop({ default: "", trim: true })
  lastName?: string;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

@Schema({ timestamps: true })
export class User extends Document<Types.ObjectId> {
  @Prop({ default: "", lowercase: true, trim: true })
  email?: string;

  @Prop({ default: "", trim: true })
  number?: string;

  @Prop({
    minlength: 8,
    select: false,
  })
  password?: string;

  @Prop({ default: "" })
  passwordChangedAt!: Date;

  @Prop({ enum: UserRoleEnum, required: true })
  role!: string;

  @Prop({ default: false, required: true })
  isEmailVerified!: boolean;

  @Prop({ default: false, required: true })
  isNumberVerified!: boolean;

  @Prop({ enum: LoginTypeEnum, required: true })
  signUpType!: string;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: false })
  isBlocked!: boolean;

  @Prop({ default: false })
  isProfileSetup!: boolean;

  @Prop({ type: UserProfileSchema, default: {} })
  profile!: UserProfile;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $ne: "" } },
  },
);

UserSchema.index(
  { number: 1 },
  {
    unique: true,
    partialFilterExpression: { number: { $type: "string", $ne: "" } },
  },
);
