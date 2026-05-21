import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Req,
  NotFoundException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  AdminLoginDto,
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
import { Response } from "express";
import {
  ActionCheckSwagger,
  AdminLoginSwagger,
  AuthTag,
  ForgotPasswordSwagger,
  LoginSwagger,
  LogoutSwagger,
  RefreshTokenSwagger,
  ResetPasswordSwagger,
  SendOtpSwagger,
  SignUpSwagger,
  SocialLoginSwagger,
  TestLoginSwagger,
  VerifyForgotPasswordOtpSwagger,
  VerifyOtpSwagger,
} from "./auth.swagger";
import { Public } from "src/common/decorators/public.decorator";
import { messages } from "src/common/helpers/message";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { GetFullUser } from "src/common/decorators/get-full-user.decorator";
import { User } from "src/user/entities/user.entity";

@AuthTag()
@Controller({ version: "1", path: "auth" })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseHandler: ResponseHandler,
  ) {}

  @Post("signup")
  @Public()
  @SignUpSwagger()
  async signUp(
    @Res() res: Response,
    @Body() dto: SignUpDto,
    @Req() req: Request,
  ) {
    try {
      const result = await this.authService.signUp(dto);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndAction(
          res,
          result.message,
          result.data,
          result.action,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }
  @Post("signin")
  @Public()
  @LoginSwagger()
  async signIn(
    @Res() res: Response,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    try {
      const result = await this.authService.signIn(dto);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndTokenAndAction(
          res,
          result.message,
          result.data,
          result.accessToken,
          result.refreshToken,
          result.action,
        );
      }
      return this.responseHandler.errorResponseWithAction(
        res,
        result.message,
        result?.action,
      );
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("test-login")
  @Public()
  @TestLoginSwagger()
  async testLogin(@Res() res: Response, @Body() dto: TestLoginDto) {
    try {
      if (
        process.env.NODE_ENV !== "local" &&
        process.env.NODE_ENV !== "development"
      ) {
        throw new NotFoundException();
      }

      const result = await this.authService.testLogin(dto);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndTokenAndAction(
          res,
          result.message,
          result.data,
          result.accessToken,
          undefined,
          result.action,
        );
      }
      return this.responseHandler.errorResponseWithAction(
        res,
        result.message,
        result?.action,
      );
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("refresh-token")
  @Public()
  @RefreshTokenSwagger()
  async refreshToken(
    @Res() res: Response,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    try {
      const result = await this.authService.refreshToken(refreshTokenDto);
      if (result.success) {
        return this.responseHandler.successResponseWithData(
          res,
          result.message,
          {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("logout")
  @LogoutSwagger()
  async logout(
    @Res() res: Response,
    @Body() logoutDto: LogoutDto,
    @GetFullUser() user: User,
  ) {
    try {
      const result = await this.authService.logout(user, logoutDto);
      if (result.success) {
        return this.responseHandler.successResponse(res, result.message);
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("send-otp")
  @Public()
  @SendOtpSwagger()
  async sendOtp(@Res() res: Response, @Body() otpSendDto: OtpSendDto) {
    try {
      const result = await this.authService.sendOtp(otpSendDto);
      if (result.success) {
        return this.responseHandler.successResponse(res, result.message);
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("verify-otp")
  @Public()
  @VerifyOtpSwagger()
  async verifyOtp(
    @Res() res: Response,
    @Body() verifyOtpDto: VerifyAuthOtpDto,
  ) {
    try {
      const result = await this.authService.verifyOtp(verifyOtpDto);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndTokenAndAction(
          res,
          result.message,
          result.data,
          result.accessToken,
          result.refreshToken,
          result.action,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("forgot-password")
  @Public()
  @ForgotPasswordSwagger()
  async forgotPassword(
    @Res() res: Response,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    try {
      const result = await this.authService.forgotPassword(forgotPasswordDto);
      if (result.success) {
        return this.responseHandler.successResponseWithData(
          res,
          result.message,
          result.data,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("verify-forgot-password-otp")
  @Public()
  @VerifyForgotPasswordOtpSwagger()
  async verifyForgotPasswordOtp(
    @Res() res: Response,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    try {
      const result =
        await this.authService.verifyForgotPasswordOtp(verifyOtpDto);
      if (result.success) {
        return this.responseHandler.successResponseWithData(
          res,
          result.message,
          result.data,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("reset-password")
  @Public()
  @ResetPasswordSwagger()
  async resetPassword(
    @Res() res: Response,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      if (result.success) {
        return this.responseHandler.successResponseWithData(
          res,
          result.message,
          result.data,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("admin-login")
  @Public()
  @AdminLoginSwagger()
  async adminLogin(@Res() res: Response, @Body() adminLoginDto: AdminLoginDto) {
    try {
      const result = await this.authService.adminLogin(adminLoginDto);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndTokenAndAction(
          res,
          result.message,
          result.data,
          result.accessToken,
          result.refreshToken,
          result.action,
        );
      }
      return this.responseHandler.errorResponseWithAction(
        res,
        result.message,
        result.action,
      );
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Post("social-auth")
  @Public()
  @SocialLoginSwagger()
  async socialAuth(@Body() socialAuthDto: SocialAuthDto, @Res() res: Response) {
    try {
      const result = await this.authService.socialAuth(socialAuthDto);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndTokenAndAction(
          res,
          result.message,
          result.data,
          result.accessToken,
          result.refreshToken,
          result.action,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Get("action-check")
  @ActionCheckSwagger()
  async actionCheck(@GetFullUser() user: User, @Res() res: Response) {
    try {
      const result = await this.authService.actionCheck(user);
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndAction(
          res,
          result.message,
          {},
          result.action,
        );
      }
      return this.responseHandler.errorResponseWithAction(
        res,
        result.message,
        result.action,
      );
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }
}
