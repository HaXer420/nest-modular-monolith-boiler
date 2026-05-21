import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { InternalServerErrorSwagger } from "src/common/helpers/utility";

export const UserTag = () => {
  return applyDecorators(ApiTags("User"));
};

export const ProfileDetailsSwagger = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: "Get logged-in user's profile details" }),
    ApiResponse({
      status: 200,
      description: "User profile fetched successfully",
      schema: {
        example: {
          success: true,
          statusCode: 200,
          message: "User Profile Fetched",
          data: {
            user: {
              id: "USER_ID",
              email: "user@example.com",
              number: "",
              role: "user",
              isEmailVerified: true,
              isNumberVerified: false,
              isProfileSetup: false,
              signUpType: "email",
              createdAt: "2026-04-23T10:00:00.000Z",
              profile: {
                image: "",
                firstName: "",
                lastName: "",
                professionalTitle: "",
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

export const DeleteCurrentUserSwagger = () => {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: "Soft delete currently logged-in user" }),
    ApiResponse({
      status: 200,
      description: "User deleted successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "User deleted successfully",
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
            UserAlreadyDeleted: {
              summary: "User already deleted",
              value: {
                statusCode: 400,
                message: "User is already deleted",
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
