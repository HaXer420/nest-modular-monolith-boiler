import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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
import { ActionEnum } from "src/common/helpers/enums";
import { InternalServerErrorSwagger } from "src/common/helpers/utility";
import {
  AdminSignInResponseDto,
  UserSignInResponseDto,
  UserSignUpResponseDto,
} from "./dto/response-auth.dto";

// @ApiTags at the controller level
export const AuthTag = () => {
  return applyDecorators(ApiTags("Auth"));
};

export const ActionCheckSwagger = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: "Get current auth action for logged-in user" }),
    ApiResponse({
      status: 200,
      description: "Current action fetched successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "Action fetched",
          action: ActionEnum.LOGIN_GRANTED,
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: "Unauthorized",
      schema: {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

// Swagger decorator for signUp()
export const SignUpSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Sign up user" }),
    ApiBody({ type: SignUpDto }),
    ApiResponse({
      status: 200,
      description: "User signed up successfully",
      type: UserSignUpResponseDto,
      schema: {
        example: {
          statusCode: 200,
          message: "Your account has been created",
          data: {
            id: "USER_ID",
            email: "user@example.com",
            number: "",
            role: "user",
            isEmailVerified: false,
            isNumberVerified: false,
            loginType: "email",
            createdAt: "2026-04-22T16:34:25.793Z",
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            UserAlreadyExists: {
              summary: "User already exists",
              value: {
                statusCode: 400,
                message: "User with given email already exists",
              },
            },
            InvalidRole: {
              summary: "Invalid signup role",
              value: {
                statusCode: 400,
                message: "Role must be either candidate or recruiter",
              },
            },
            BadRequest: {
              summary: "Bad request",
              value: { statusCode: 400, message: "Bad Request" },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};
// Swagger decorator for signIn()
export const LoginSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Sign in user" }),
    ApiBody({
      type: LoginDto,
      description:
        "Login with either email or phone number, password, and device info",
    }),
    ApiResponse({
      status: 200,
      description: "User signed in successfully",
      type: UserSignInResponseDto,
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "Login successful",
          action: "loginGranted",
          data: {
            id: "USER_ID",
            email: "user@example.com",
            number: "",
            role: "user",
            isEmailVerified: true,
            isNumberVerified: false,
            signUpType: "email",
          },
          accessToken: "ACCESS_TOKEN",
          refreshToken: "REFRESH_TOKEN",
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            MissingCredentials: {
              summary: "Missing login credentials",
              value: {
                statusCode: 400,
                message: "Email/Number or Password is required",
              },
            },
            UserNotFound: {
              summary: "User not found",
              value: { statusCode: 400, message: "User not found" },
            },
            InvalidCredentials: {
              summary: "Invalid password",
              value: { statusCode: 400, message: "Invalid credentials" },
            },
            VerificationRequired: {
              summary: "Account is not verified",
              value: {
                statusCode: 400,
                message:
                  "Verification required! OTP sent to your email/number which is valid for 5 minutes.",
                action: "unverified",
              },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

export const TestLoginSwagger = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Test login with non-expiring access token",
      description:
        "Testing-only route. Validates credentials but does not create a refresh session and returns only a non-expiring access token.",
    }),
    ApiBody({
      type: TestLoginDto,
      description:
        "Login with either email or phone number and password. Device info is not required.",
    }),
    ApiResponse({
      status: 200,
      description: "Test login successful",
      type: UserSignInResponseDto,
      schema: {
        example: {
          statusCode: 200,
          message: "Login successful",
          action: "loginGranted",
          data: {
            id: "USER_ID",
            email: "user@example.com",
            number: "",
            role: "user",
            isEmailVerified: true,
            isNumberVerified: false,
            signUpType: "email",
          },
          accessToken: "NON_EXPIRING_ACCESS_TOKEN",
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            MissingCredentials: {
              summary: "Missing login credentials",
              value: {
                statusCode: 400,
                message: "Email/Number or Password is required",
              },
            },
            UserNotFound: {
              summary: "User not found",
              value: { statusCode: 400, message: "User not found" },
            },
            InvalidCredentials: {
              summary: "Invalid password",
              value: { statusCode: 400, message: "Invalid credentials" },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

export const SocialLoginSwagger = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Authenticate user via social login (Google or Apple)",
    }),
    ApiBody({
      type: SocialAuthDto,
      description:
        "Send Firebase social login token, provider type (google/apple), and device info",
    }),
    // ✅ 200 OK
    ApiResponse({
      status: 200,
      description: "User authenticated successfully",
      type: UserSignInResponseDto,
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "User authenticated successfully",
          action: "profilePending",
          data: {
            id: "USER_ID",
            email: "user@example.com",
            number: "",
            role: "candidate",
            isEmailVerified: true,
            isNumberVerified: false,
            signUpType: "google",
          },
          accessToken: "ACCESS_TOKEN",
          refreshToken: "REFRESH_TOKEN",
        },
      },
    }),
    // ❌ 400 Bad Request
    ApiBadRequestResponse({
      description: "Bad request due to invalid input or token issues",
      content: {
        "application/json": {
          examples: {
            InvalidLoginType: {
              summary: "Invalid login type",
              value: {
                statusCode: 400,
                message: "Invalid login type",
              },
            },
            InvalidGoogleToken: {
              summary: "Invalid social token",
              value: {
                statusCode: 400,
                message: "Invalid social auth type",
              },
            },
            InvalidAppleToken: {
              summary: "Social provider mismatch",
              value: {
                statusCode: 400,
                message: "Invalid social auth type",
              },
            },
            EmailNotProvided: {
              summary: "Email not provided by provider",
              value: {
                statusCode: 400,
                message: "Email not provided by provider",
              },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

export const RefreshTokenSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Refresh access token" }),
    ApiBody({
      type: RefreshTokenDto,
      description:
        "Use a valid device-bound refresh token to get a new access token and rotated refresh token",
    }),
    ApiResponse({
      status: 200,
      description: "Access token refreshed successfully",
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "Token refreshed successfully",
          data: {
            accessToken: "NEW_ACCESS_TOKEN",
            refreshToken: "NEW_REFRESH_TOKEN",
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            InvalidRefreshToken: {
              summary: "Invalid, expired, revoked, or mismatched refresh token",
              value: {
                statusCode: 400,
                message: "Invalid refresh token",
              },
            },
            UserNotFound: {
              summary: "User not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

export const LogoutSwagger = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: "Logout current device session" }),
    ApiBody({
      type: LogoutDto,
      description:
        "Revoke the authenticated user's refresh session for the given device",
    }),
    ApiResponse({
      status: 200,
      description: "Logged out successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "Logged out successfully",
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: "Missing, invalid, or expired access token",
      schema: {
        example: {
          statusCode: 401,
          message: "No authentication token provided.",
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            MissingDevice: {
              summary: "Device info is missing",
              value: {
                statusCode: 400,
                message: "device should not be empty",
              },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

export const VerifyOtpSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Verify signup or login OTP" }),
    ApiBody({
      type: VerifyAuthOtpDto,
      description:
        "Verify OTP using either email or phone number, then create access/refresh tokens for the provided device",
    }),

    // ✅ 200 - Success
    ApiResponse({
      status: 200,
      description: "OTP verified successfully",
      type: UserSignInResponseDto,
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "OTP successfully verified",
          action: "loginGranted",
          data: {
            id: "USER_ID",
            email: "user@example.com",
            number: "",
            role: "candidate",
            isEmailVerified: true,
            isNumberVerified: false,
            signUpType: "email",
          },
          accessToken: "ACCESS_TOKEN",
          refreshToken: "REFRESH_TOKEN",
        },
      },
    }),

    // ❌ 400 - Bad Request (OTP invalid or expired)
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            MissingEmailOrNumber: {
              summary: "Email or phone number is missing",
              value: {
                statusCode: 400,
                message: "Email/Number is required",
              },
            },
            UserNotFound: {
              summary: "User not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
            InvalidOtp: {
              summary: "Invalid, used, or expired OTP",
              value: {
                statusCode: 400,
                message: "Incorrect OTP code",
              },
            },
          },
        },
      },
    }),

    // ❌ 500 - Internal error
    InternalServerErrorSwagger(),
  );
};

export const SendOtpSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Send OTP to email or phone number" }),
    ApiBody({
      type: OtpSendDto,
      description: "Send an OTP for the requested OTP purpose",
    }),
    ApiResponse({
      status: 200,
      description: "OTP sent successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "OTP sent successfully",
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            MissingEmailOrNumber: {
              summary: "Email or phone number is missing",
              value: {
                statusCode: 400,
                message: "Email/Number is required",
              },
            },
            UserNotFound: {
              summary: "User not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
            InvalidPurpose: {
              summary: "Invalid OTP purpose",
              value: {
                statusCode: 400,
                message: "Invalid OTP purpose",
              },
            },
          },
        },
      },
    }),
    InternalServerErrorSwagger(),
  );
};

export function ForgotPasswordSwagger() {
  return applyDecorators(
    ApiOperation({ summary: "Send password reset OTP to email or number" }),
    ApiBody({
      type: ForgotPasswordDto,
      description: "Send a password reset OTP to the registered email address",
    }),

    // ✅ 200 - OTP Sent Successfully
    ApiResponse({
      status: 200,
      description: "Password reset OTP sent successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "OTP sent successfully",
        },
      },
    }),

    // ❌ 400 - Failed to send/store OTP
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            FailedToSendOtp: {
              summary: "Password reset OTP email sending failed",
              value: {
                statusCode: 400,
                message: "Failed to send OTP",
              },
            },
            UserNotFound: {
              summary: "User not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
          },
        },
      },
    }),

    // ❌ 500 - Internal Server Error
    InternalServerErrorSwagger(),
  );
}

export const VerifyForgotPasswordOtpSwagger = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Verify OTP sent to email for forgot password flow",
    }),
    ApiBody({ type: VerifyOtpDto }),

    // ✅ 200 - OTP Verified
    ApiResponse({
      status: 200,
      description: "OTP verified successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "OTP verified successfully",
          data: {},
        },
      },
    }),

    // ❌ 400 - Validation or OTP error
    ApiBadRequestResponse({
      description: "Bad request (invalid email, OTP, or expired)",
      content: {
        "application/json": {
          examples: {
            UserNotFound: {
              summary: "User not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
            InvalidOtp: {
              summary: "Invalid OTP",
              value: {
                statusCode: 400,
                message: "Invalid OTP",
              },
            },
            OtpExpired: {
              summary: "OTP expired",
              value: {
                statusCode: 400,
                message: "OTP has expired",
              },
            },
          },
        },
      },
    }),

    // ❌ 500 - Internal Server Error
    InternalServerErrorSwagger(),
  );
};

export const ResetPasswordSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Reset password after verifying OTP" }),
    ApiBody({ type: ResetPasswordDto }),

    // ✅ 200 - Success
    ApiResponse({
      status: 200,
      description: "Password reset successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "Password reset successfully",
        },
      },
    }),

    // ❌ 400 - User not found or password already exists
    ApiBadRequestResponse({
      description: "Bad request - user issues or password validation failed",
      content: {
        "application/json": {
          examples: {
            UserNotFound: {
              summary: "User not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
            PasswordAlreadyExists: {
              summary: "Password already in use",
              value: {
                statusCode: 400,
                message:
                  "New password cannot be the same as the current password",
              },
            },
            FailedToResetPassword: {
              summary: "Update failed",
              value: {
                statusCode: 400,
                message: "Failed to reset password",
              },
            },
          },
        },
      },
    }),

    // ❌ 500 - Server error
    InternalServerErrorSwagger(),
  );
};

export const AdminLoginSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: "Admin login" }),
    ApiBody({
      type: AdminLoginDto,
      description: "Login with admin email, password, and device info",
    }),

    // ✅ 200 - Login success
    ApiResponse({
      status: 200,
      description: "Admin logged in successfully",
      type: AdminSignInResponseDto,
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "Login successful",
          action: "loginGranted",
          data: {
            id: "ADMIN_USER_ID",
            email: "admin@example.com",
            role: "admin",
            isEmailVerified: true,
            signUpType: "email",
          },
          accessToken: "ACCESS_TOKEN",
          refreshToken: "REFRESH_TOKEN",
        },
      },
    }),

    // ❌ 400 - Validation errors
    ApiBadRequestResponse({
      description: "Bad Request",
      content: {
        "application/json": {
          examples: {
            UserNotFound: {
              summary: "Admin user not found",
              value: {
                statusCode: 400,
                message: "User not found",
              },
            },
            InvalidCredentials: {
              summary: "Invalid password",
              value: {
                statusCode: 400,
                message: "Invalid credentials",
              },
            },
            VerificationRequired: {
              summary: "Admin email is not verified",
              value: {
                statusCode: 400,
                message:
                  "Verification required! OTP sent to your email/number which is valid for 5 minutes.",
                action: "unverified",
              },
            },
          },
        },
      },
    }),

    // ❌ 500 - Server error
    InternalServerErrorSwagger(),
  );
};
