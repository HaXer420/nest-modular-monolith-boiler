import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/user/entities/user.entity";

@Schema({ timestamps: true })
export class AuthSession extends Document<Types.ObjectId> {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  deviceId!: string;

  @Prop({ default: "", trim: true })
  fcmToken?: string;

  @Prop({ required: true, select: false })
  refreshTokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: null })
  revokedAt?: Date;

  @Prop({ default: null })
  lastUsedAt?: Date;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);

AuthSessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
