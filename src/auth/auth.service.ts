import { Injectable, Logger } from "@nestjs/common";
import {
  AdminLoginDto,
  DeviceDto,
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  OtpSendDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignUpDto,
  SocialAuthDto,
  TestLoginDto,
  VerifyAuthOtpDto,
  VerifyOtpDto,
} from "./dto/create-auth.dto";
import * as bcrypt from "bcrypt";
import { createHash, randomUUID } from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { generateOtp } from "src/common/helpers/utility";
import { SendEmailService } from "src/common/helpers/email.service";
import { Otp } from "./entities/otp.entity";
import { AuthSession } from "./entities/auth-session.entity";
import { JwtService } from "src/common/helpers/jwt.service";
import {
  ActionEnum,
  LoginTypeEnum,
  OtpTypeEnum,
  UserRoleEnum,
} from "src/common/helpers/enums";
import { messages } from "src/common/helpers/message";
import { FirebaseService } from "src/common/helpers/firebase.service";
import { User } from "src/user/entities/user.entity";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { UserSignUpResponseDto } from "./dto/response-auth.dto";
import {
  toAdminSignInResponse,
  toUserSignInResponse,
  toUserSignUpResponse,
} from "./mappers/response-auth.mapper";
import { actionSwitches } from "src/common/helpers/action.helper";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(AuthSession.name)
    private authSessionModel: Model<AuthSession>,
    private readonly mailService: SendEmailService,
    private readonly responseService: ResponseHandler,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
  ) {}

  private async passwordHash(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async passwordCompare(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async createAccessToken(user: User, expires = true): Promise<string> {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        tokenType: "access",
      },
      expires ? process.env.JWT_ACCESS_EXPIRES_IN || "15m" : undefined,
    );
  }

  private async createRefreshToken(
    user: User,
    deviceId: string,
    expires = true,
  ): Promise<string> {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        deviceId,
        jti: randomUUID(),
        tokenType: "refresh",
      },
      expires ? process.env.JWT_REFRESH_EXPIRES_IN || "7d" : undefined,
    );
  }

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(this.digestRefreshToken(refreshToken), 12);
  }

  private async compareRefreshToken(
    refreshToken: string,
    refreshTokenHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(
      this.digestRefreshToken(refreshToken),
      refreshTokenHash,
    );
  }

  private digestRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private getRefreshTokenExpiresAt(): Date {
    return new Date(
      Date.now() +
        this.parseExpiryToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
    );
  }

  private parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);

    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  private async saveAuthSession(
    user: User,
    device: DeviceDto,
    refreshToken: string,
  ): Promise<void> {
    await this.authSessionModel.findOneAndUpdate(
      {
        userId: user._id,
        deviceId: device.id,
      },
      {
        userId: user._id,
        deviceId: device.id,
        fcmToken: device.fcmToken || "",
        refreshTokenHash: await this.hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiresAt(),
        revokedAt: null,
        lastUsedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const payload = await this.jwtService.verify(dto.refreshToken);

      if (
        payload?.tokenType !== "refresh" ||
        !payload?.sub ||
        !Types.ObjectId.isValid(payload.sub) ||
        payload?.deviceId !== dto.device.id
      ) {
        return {
          success: false,
          message: messages.INVALID_REFRESH_TOKEN,
        };
      }

      const userId = new Types.ObjectId(payload.sub);

      const authSession = await this.authSessionModel
        .findOne({
          userId,
          deviceId: dto.device.id,
          revokedAt: { $eq: null },
        })
        .select("+refreshTokenHash");

      if (!authSession || authSession.expiresAt < new Date()) {
        return {
          success: false,
          message: messages.INVALID_REFRESH_TOKEN,
        };
      }

      const isRefreshTokenValid = await this.compareRefreshToken(
        dto.refreshToken,
        authSession.refreshTokenHash,
      );

      if (!isRefreshTokenValid) {
        return {
          success: false,
          message: messages.INVALID_REFRESH_TOKEN,
        };
      }

      const user = await this.userModel.findById(userId);

      if (!user) {
        return {
          success: false,
          message: messages.USER_NOT_FOUND,
        };
      }

      const accessToken = await this.createAccessToken(user);
      const refreshToken = await this.createRefreshToken(user, dto.device.id);
      authSession.refreshTokenHash = await this.hashRefreshToken(refreshToken);
      authSession.expiresAt = this.getRefreshTokenExpiresAt();
      authSession.lastUsedAt = new Date();
      if (dto.device.fcmToken) {
        authSession.fcmToken = dto.device.fcmToken;
      }
      await authSession.save();

      return {
        success: true,
        message: messages.TOKEN_REFRESHED_SUCCESSFULLY,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        message: messages.INVALID_REFRESH_TOKEN,
      };
    }
  }

  async logout(
    user: User,
    dto: LogoutDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.authSessionModel.findOneAndUpdate(
      {
        userId: user._id,
        deviceId: dto.device.id,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    );

    return {
      success: true,
      message: messages.LOGOUT_SUCCESS,
    };
  }

  private async sendOtpEmail(email: string, otp: number): Promise<void> {
    try {
      await this.mailService.sendOtpToEmail(email, otp);
    } catch (error) {
      this.logger.warn(messages.FAILED_TO_SEND_OTP);
    }
  }

  private async createOtp(
    userId: Types.ObjectId,
    type: OtpTypeEnum,
  ): Promise<number> {
    await this.otpModel.findOneAndDelete({ userId: userId, type: type });
    const otp: number = await generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5.5 * 60 * 1000);
    await this.otpModel.create({ userId, otp, expiresAt: otpExpiresAt, type });
    return otp;
  }

  async signUp(dto: SignUpDto): Promise<{
    success: boolean;
    message: string;
    action?: ActionEnum;
    data?: UserSignUpResponseDto | object;
  }> {
    const { email, number, password, role } = dto;
    let preUser;

    if (!email && !number) {
      return {
        success: false,
        message: `Email or Number required`,
        data: {},
      };
    }

    if (email) {
      preUser = await this.userModel.findOne({ email: email });
    }
    if (number) {
      preUser = await this.userModel.findOne({ number: number });
    }

    if (preUser && preUser.isDeleted) {
      return {
        success: false,
        message: messages.USER_DELETED,
        data: {},
      };
    }
    if (preUser && preUser.isBlocked) {
      return {
        success: false,
        message: messages.USER_BLOCKED,
        data: {},
      };
    }

    if (preUser) {
      return {
        success: false,
        message: `User with given ${email ? "email" : "number"} already exists`,
        data: {},
      };
    }

    const user = await this.userModel.create({
      email,
      number,
      role,
      signUpType: email ? LoginTypeEnum.EMAIL : LoginTypeEnum.NUMBER,
      password: await this.passwordHash(password),
      passwordChangedAt: Date.now(),
    });

    const otp: number = await this.createOtp(
      user._id,
      email ? OtpTypeEnum.EMAIL_VERIFICATION : OtpTypeEnum.NUMBER_VERIFICATION,
    );

    if (email) {
      this.sendOtpEmail(email, otp);
    }

    return {
      success: true,
      message: messages.ACCOUNT_CREATED_AND_OTP_SENT,
      action: ActionEnum.UNVERIFIED,
      data: toUserSignUpResponse(user),
    };
  }

  async signIn(dto: LoginDto): Promise<{
    success: boolean;
    message: string;
    data?: object;
    accessToken?: string;
    refreshToken?: string;
    action?: ActionEnum;
  }> {
    const { email, number, password, device, role } = dto;

    if ((!email && !number) || !password) {
      return {
        success: false,
        message: "Email/Number or Password is required",
      };
    }
    let user: any;

    if (email) {
      user = await this.userModel
        .findOne({ email: email, role })
        .select("+password");
    }
    if (number) {
      user = await this.userModel
        .findOne({ number: number })
        .select("+password");
    }

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    if (
      !user.password ||
      !(await this.passwordCompare(password, user.password))
    ) {
      return {
        success: false,
        message: messages.INVALID_CREDENTIALS,
      };
    }

    if (user && user.isDeleted) {
      return {
        success: false,
        message: messages.USER_DELETED,
        data: {},
      };
    }
    if (user && user.isBlocked) {
      return {
        success: false,
        message: messages.USER_BLOCKED,
        data: {},
      };
    }

    if (!user.isEmailVerified && !user.isNumberVerified) {
      const otp: number = await this.createOtp(
        user._id,
        email
          ? OtpTypeEnum.EMAIL_VERIFICATION
          : OtpTypeEnum.NUMBER_VERIFICATION,
      );

      if (email) {
        this.sendOtpEmail(email, otp);
      }

      return {
        success: false,
        message: messages.VERIFICATION_REQUIRED_AND_OTP_SENT,
        data: toUserSignInResponse(user),
        action: ActionEnum.UNVERIFIED,
      };
    }

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user, device.id);
    await this.saveAuthSession(user, device, refreshToken);

    return {
      success: true,
      message: messages.LOGIN_SUCCESS,
      data: toUserSignInResponse(user),
      action: actionSwitches(user),
      accessToken,
      refreshToken,
    };
  }

  async testLogin(dto: TestLoginDto): Promise<{
    success: boolean;
    message: string;
    data?: object;
    accessToken?: string;
    action?: ActionEnum;
  }> {
    const { email, number, password } = dto;

    if ((!email && !number) || !password) {
      return {
        success: false,
        message: "Email/Number or Password is required",
      };
    }

    const user = await this.userModel
      .findOne(email ? { email } : { number })
      .select("+password");

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    if (
      !user.password ||
      !(await this.passwordCompare(password, user.password))
    ) {
      return {
        success: false,
        message: messages.INVALID_CREDENTIALS,
      };
    }

    return {
      success: true,
      message: messages.LOGIN_SUCCESS,
      data: toUserSignInResponse(user),
      action: actionSwitches(user),
      accessToken: await this.createAccessToken(user, false),
    };
  }

  async sendOtp(
    dto: OtpSendDto,
  ): Promise<{ success: boolean; message: string; data?: object }> {
    const { email, number, purpose } = dto;
    if (!email && !number) {
      return {
        success: false,
        message: "Email/Number is required",
      };
    }
    const user = await this.userModel.findOne({ $or: [{ email }, { number }] });
    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    const otp: number = await this.createOtp(user._id, purpose);
    if (email) {
      this.sendOtpEmail(email, otp);
    }

    return {
      success: true,
      message: messages.OTP_SENT_SUCCESSFULLY,
    };
  }

  async verifyOtp(dto: VerifyAuthOtpDto): Promise<{
    success: boolean;
    message: string;
    data?: object;
    action?: ActionEnum;
    accessToken?: string;
    refreshToken?: string;
  }> {
    const { otp, email, number, device } = dto;

    if (!email && !number) {
      return {
        success: false,
        message: "Email/Number is required",
      };
    }

    const user = await this.userModel.findOne({ $or: [{ number }, { email }] });

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    const isOtpValid = await this.otpModel.findOne({
      otp: otp,
      isUsed: false,
      expiresAt: { $gt: Date.now() },
      userId: user._id,
    });

    if (!isOtpValid) {
      return {
        success: false,
        message: messages.INVALID_OTP,
      };
    }

    isOtpValid.isUsed = true;

    await isOtpValid.save();

    if (isOtpValid.type == OtpTypeEnum.EMAIL_VERIFICATION) {
      user.isEmailVerified = true;
    }
    if (isOtpValid.type == OtpTypeEnum.NUMBER_VERIFICATION) {
      user.isNumberVerified = true;
    }

    await user.save();

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user, device.id);
    await this.saveAuthSession(user, device, refreshToken);

    return {
      success: true,
      message: messages.OTP_VERIFIED,
      data: toUserSignInResponse(user),
      action: actionSwitches(user),
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string; data?: object }> {
    const { email, number, role } = forgotPasswordDto;

    if (!email && !number) {
      return {
        success: false,
        message: "Email/Number is required",
      };
    }
    const user = await this.userModel.findOne({
      $or: [{ number }, { email }],
      role,
    });

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    if (user && user.isDeleted) {
      return {
        success: false,
        message: messages.USER_DELETED,
        data: {},
      };
    }
    if (user && user.isBlocked) {
      return {
        success: false,
        message: messages.USER_BLOCKED,
        data: {},
      };
    }

    const otp = await this.createOtp(user._id, OtpTypeEnum.PASSWORD_RESET);
    const isEmailSent = await this.mailService.sendPasswordResetEmail(
      email,
      otp.toString(),
    );

    if (!isEmailSent) {
      return {
        success: false,
        message: messages.FAILED_TO_SEND_OTP,
      };
    }

    return { success: true, message: messages.OTP_SENT_SUCCESSFULLY };
  }

  async verifyForgotPasswordOtp(
    dto: VerifyOtpDto,
  ): Promise<{ success: boolean; message: string; data?: object }> {
    const { otp, email, number } = dto;

    if (!email && !number) {
      return {
        success: false,
        message: "Email/Number is required",
      };
    }

    const user = await this.userModel.findOne({ $or: [{ number }, { email }] });

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    const isOtpValid = await this.otpModel.findOne({
      otp,
      isUsed: false,
      expiresAt: { $gt: Date.now() },
      userId: user._id,
      type: OtpTypeEnum.PASSWORD_RESET,
    });

    if (!isOtpValid) {
      return {
        success: false,
        message: messages.INVALID_OTP,
      };
    }

    return {
      success: true,
      message: messages.OTP_VERIFIED,
      // data: {
      //   userId: user._id.toString(),
      // },
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string; data?: object }> {
    const { otp, email, number, password } = resetPasswordDto;

    if (!email && !number) {
      return {
        success: false,
        message: "Email/Number is required",
      };
    }
    const user = await this.userModel
      .findOne({ $or: [{ email }, { number }] })
      .select("+password");

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    const isOtpValid = await this.otpModel.findOne({
      otp,
      isUsed: false,
      userId: user._id,
      type: OtpTypeEnum.PASSWORD_RESET,
    });

    if (!isOtpValid) {
      return {
        success: false,
        message: messages.INVALID_OTP,
      };
    }

    const isSamePassword =
      user.password && (await this.passwordCompare(password, user.password));

    if (isSamePassword) {
      return {
        success: false,
        message: messages.PASSWORD_ALREADY_EXISTS,
      };
    }

    user.password = await this.passwordHash(password);
    user.passwordChangedAt = new Date();
    await user.save();

    isOtpValid.isUsed = true;
    await isOtpValid.save();

    return { success: true, message: messages.PASSWORD_RESET_SUCCESSFULLY };
  }

  async adminLogin(dto: AdminLoginDto): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    data?: object;
    action?: ActionEnum;
  }> {
    const { email, password, device } = dto;
    const user = await this.userModel
      .findOne({ email, role: UserRoleEnum.ADMIN })
      .select("+password");

    if (!user) {
      return {
        success: false,
        message: messages.USER_NOT_FOUND,
      };
    }

    if (
      !user.password ||
      !(await this.passwordCompare(password, user.password))
    ) {
      return {
        success: false,
        message: messages.INVALID_CREDENTIALS,
      };
    }
    if (!user.isEmailVerified) {
      const otp: number = await this.createOtp(
        user._id,
        OtpTypeEnum.EMAIL_VERIFICATION,
      );

      if (email) {
        this.sendOtpEmail(email, otp);
      }

      return {
        success: false,
        message: messages.VERIFICATION_REQUIRED_AND_OTP_SENT,
        data: toUserSignInResponse(user),
        action: ActionEnum.UNVERIFIED,
      };
    }

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user, device.id);
    await this.saveAuthSession(user, device, refreshToken);

    return {
      success: true,
      message: messages.LOGIN_SUCCESS,
      data: toAdminSignInResponse(user),
      action: actionSwitches(user),
      accessToken,
      refreshToken,
    };
  }

  async socialAuth(dto: SocialAuthDto): Promise<{
    success: boolean;
    message: string;
    data?: object;
    action?: ActionEnum;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const { token, type, device, role } = dto;
      const decoded = await this.firebaseService.verifySocialAuthToken(token);

      const provider: string | undefined =
        decoded.firebase?.sign_in_provider?.split(".")[0];

      if (provider !== type) {
        return {
          success: false,
          message: messages.INVALID_SOCIAL_AUTH_TYPE,
        };
      }

      if (!decoded.email) {
        return {
          success: false,
          message: messages.EMAIL_NOT_PROVIDED_BY_PROVIDER,
        };
      }

      let user = await this.userModel.findOne({ email: decoded.email, role });

      if (!user) {
        user = await this.userModel.create({
          email: decoded.email,
          role: UserRoleEnum.USER,
          signUpType: type,
          isEmailVerified: true,
        });
      } else {
        if (user && user.isDeleted) {
          return {
            success: false,
            message: messages.USER_DELETED,
            data: {},
          };
        }
        if (user && user.isBlocked) {
          return {
            success: false,
            message: messages.USER_BLOCKED,
            data: {},
          };
        }

        user.signUpType = type;
        user.isEmailVerified = true;
        await user.save();
      }

      const accessToken = await this.createAccessToken(user);
      const refreshToken = await this.createRefreshToken(user, device.id);
      await this.saveAuthSession(user, device, refreshToken);

      return {
        success: true,
        message: messages.USER_AUTHENTICATED_SUCCESSFULLY,
        data: toUserSignInResponse(user),
        action: actionSwitches(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.warn(`Error during socialAuth: ${error}`);
      return { success: false, message: messages.SOMETHING_WENT_WRONG };
    }
  }

  async actionCheck(
    user: User,
  ): Promise<{ success: boolean; message: string; action: ActionEnum }> {
    return {
      success: true,
      message: "Action fetched",
      action: actionSwitches(user),
    };
  }
}
