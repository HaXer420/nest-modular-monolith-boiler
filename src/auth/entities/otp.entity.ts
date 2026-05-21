import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { OtpTypeEnum } from "src/common/helpers/enums";
import { User } from "src/user/entities/user.entity";

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, default: null, index: true })
  userId!: Types.ObjectId;

  @Prop({ default: "", required: true, length: 4 })
  otp!: Number;

  @Prop({ default: false })
  isUsed!: Boolean;

  @Prop({ enum: OtpTypeEnum })
  type?: String;

  @Prop({ default: "", required: true })
  expiresAt!: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
