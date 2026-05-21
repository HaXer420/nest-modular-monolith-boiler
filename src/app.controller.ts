import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { AppTag, DeleteFileSwagger, UploadFilesSwagger } from "./app.swagger";
import { GetFullUser } from "./common/decorators/get-full-user.decorator";
import { ResponseHandler } from "./common/helpers/response-handler";
import { Public } from "./common/decorators/public.decorator";
import { User } from "./user/entities/user.entity";
import { Roles } from "./common/decorators/role.decorator";
import { UserRoleEnum } from "./common/helpers/enums";

@AppTag()
@Controller({ version: "1" })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly responseHandler: ResponseHandler,
  ) {}

  @Get("health-check")
  @Public()
  healthCheck() {
    return "OK";
  }

  @Put("upload-media")
  @UploadFilesSwagger()
  @UseInterceptors(FilesInterceptor("files", 10)) // Accept up to 10 files
  async upload(
    @Res() res: Response,
    @UploadedFiles() files: Express.Multer.File[],
    @GetFullUser() user: User,
  ) {
    try {
      if (!files || files.length === 0) {
        return res.status(400).send({ message: "Files are required" });
      }
      const result = await this.appService.upload(files, user);
      if (result.success) {
        return this.responseHandler.successResponseWithData(
          res,
          result.message,
          result.data,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      console.log(error);
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }

  @Delete("delete-media")
  @DeleteFileSwagger()
  async delete(
    @Res() res: Response,
    @Query("path") path: string,
    @GetFullUser() user: User,
  ) {
    try {
      if (!path) {
        return res.status(400).send({ message: "Path is required" });
      }
      const result = await this.appService.deleteFile(path, user);
      if (result.success) {
        return this.responseHandler.successResponse(res, result.message);
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      console.log(error);
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }
  @Post("backup/upload")
  @Roles(UserRoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor("file"))
  async uploadBackup(@UploadedFile() file: Express.Multer.File) {
    return this.appService.uploadBackupToS3(file);
  }
}
