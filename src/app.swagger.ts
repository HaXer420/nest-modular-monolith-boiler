import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import {
  InternalServerErrorSwagger,
  UnauthorizedSwagger,
} from "./common/helpers/utility";

// @ApiTags at the controller level
export function AppTag() {
  return applyDecorators(ApiTags("App"));
}

// Swagger decorator for file upload
export function UploadFilesSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiConsumes("multipart/form-data"),
    ApiBody({
      schema: {
        type: "object",
        required: ["files"],
        properties: {
          files: {
            type: "array",
            items: {
              type: "string",
              format: "binary",
            },
          },
        },
      },
    }),
    ApiOperation({ summary: "Upload multiple files" }),
    ApiResponse({
      status: 200,
      description: "Files uploaded successfully",
      schema: {
        example: {
          statusCode: 200,
          message: "Files uploaded successfully",
          data: [
            {
              key: "USER_ID/media/1754548595728-0.png",
              url: "https://dummy.s3.eu-west-2.amazonaws.com/USER_ID/media/1754548595728-0.png",
              originalName: "profile.png",
              mimeType: "image/png",
              size: 245678,
            },
          ],
        },
      },
    }),
    ApiBadRequestResponse({
      description: "No files provided or invalid format",
      schema: {
        example: {
          statusCode: 400,
          message: "Files are required",
        },
      },
    }),
    UnauthorizedSwagger(),
    InternalServerErrorSwagger(),
  );
}

// Swagger decorator for file delete
export function DeleteFileSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: "Delete a file" }),
    ApiResponse({
      status: 200,
      description: "File deleted successfully",
      schema: {
        example: { statusCode: 200, message: "File deleted successfully" },
      },
    }),
    ApiBadRequestResponse({
      description: "Path is required",
      schema: {
        example: { statusCode: 400, message: "Path is required" },
      },
    }),
    ApiNotFoundResponse({
      description: "File does not exist in cloud storage",
      schema: {
        example: {
          statusCode: 404,
          message: "File does not exist in cloud storage",
        },
      },
    }),
    UnauthorizedSwagger(),
    InternalServerErrorSwagger(),
  );
}
