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
import { InternalServerErrorSwagger } from "src/common/helpers/utility";
import { SetupProfileDto } from "./dto/setup-profile.dto";

export const OnboardingTag = () => {
  return applyDecorators(ApiTags("Onboarding"));
};

export const SetupProfileSwagger = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: "Setup logged-in user's profile" }),
    ApiBody({ type: SetupProfileDto }),
    ApiResponse({
      status: 200,
      description: "User profile setup successfully",
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "Profile setup successfully",
          action: "login-granted",
          data: {
            user: {
              id: "USER_ID",
              email: "user@example.com",
              number: "+447700900123",
              role: "user",
              isEmailVerified: true,
              isNumberVerified: false,
              isProfileSetup: true,
              signUpType: "email",
              createdAt: "2026-04-23T10:00:00.000Z",
              profile: {
                image: "https://example.com/profile.png",
                firstName: "John",
                lastName: "Doe",
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: "Bad Request",
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
            NumberAlreadyExists: {
              summary: "Phone number already exists",
              value: {
                statusCode: 400,
                message: "User with given number already exists",
              },
            },
          },
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
