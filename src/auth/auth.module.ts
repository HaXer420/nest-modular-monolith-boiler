import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Otp, OtpSchema } from "./entities/otp.entity";
import {
  AuthSession,
  AuthSessionSchema,
} from "./entities/auth-session.entity";
import { SendEmailService } from "src/common/helpers/email.service";
import { JwtService } from "src/common/helpers/jwt.service";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { FirebaseService } from "src/common/helpers/firebase.service";
import { User, UserSchema } from "src/user/entities/user.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ResponseHandler,
    SendEmailService,
    JwtService,
    FirebaseService,
  ],
  exports: [MongooseModule],
})
export class AuthModule {}
