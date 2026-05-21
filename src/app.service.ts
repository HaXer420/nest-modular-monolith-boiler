import { Injectable } from "@nestjs/common";
import * as path from "path";
import { UploadService } from "./common/helpers/aws.service";
import { FileUploadConstants } from "./common/helpers/enums";
import { messages } from "./common/helpers/message";
import { User } from "./user/entities/user.entity";

@Injectable()
export class AppService {
  constructor(private readonly uploadService: UploadService) {}

  private buildPublicUrl(key: string): string {
    const baseUrl =
      process.env.AWS_BUCKET_BASE_URL ||
      `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

    return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
  }

  private getUploadFolder(userId: string): string {
    return `${userId}/media`;
  }

  private extractCloudKey(filePath: string): string {
    const trimmedPath = filePath.trim();
    const bucketBaseUrl = process.env.AWS_BUCKET_BASE_URL;

    if (bucketBaseUrl && trimmedPath.startsWith(bucketBaseUrl)) {
      return trimmedPath.slice(bucketBaseUrl.length).replace(/^\/+/, "");
    }

    try {
      const parsedUrl = new URL(trimmedPath);
      return parsedUrl.pathname.replace(/^\/+/, "");
    } catch {
      return trimmedPath.replace(/^\/+/, "");
    }
  }

  async upload(
    files: Express.Multer.File[],
    user: User,
  ): Promise<{ success: boolean; message: string; data?: object[] }> {
    if (!files?.length) {
      return { success: false, message: "Files are required" };
    }

    const uploadFolder = this.getUploadFolder(String(user._id));

    for (const file of files) {
      if (!FileUploadConstants.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return { success: false, message: messages.INVALID_FILE };
      }

      if (file.size > FileUploadConstants.MAX_SIZE) {
        return { success: false, message: messages.FILE_TOO_LARGE };
      }
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        const extension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${index}${extension}`;
        const key = await this.uploadService.uploadFile(
          file,
          uploadFolder,
          fileName,
          file.mimetype,
        );

        return {
          key,
          url: this.buildPublicUrl(key),
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      }),
    );

    return {
      success: true,
      message: messages.FILES_UPLOADED_SUCCESSFULLY,
      data: uploadedFiles,
    };
  }

  async deleteFile(
    filePath: string,
    user: User,
  ): Promise<{ success: boolean; message: string }> {
    const key = this.extractCloudKey(filePath);

    if (!key) {
      return { success: false, message: "Path is required" };
    }

    const userMediaPrefix = `${String(user._id)}/media/`;
    if (!key.startsWith(userMediaPrefix)) {
      return {
        success: false,
        message: "You do not have permission to delete this file",
      };
    }

    await this.uploadService.deleteFromCloud(key);

    return {
      success: true,
      message: messages.FILE_DELETED_SUCCESSFULLY,
    };
  }

  async uploadBackupToS3(file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: "No file provided" };
    }

    if (file.size > 50 * 1024 * 1024) {
      return { success: false, message: "Backup file is too large (max 50MB)" };
    }

    if (!FileUploadConstants.ALLOWED_BACKUP_TYPES.includes(file.mimetype)) {
      return {
        success: false,
        message: "Invalid backup file type. Only JSON is allowed.",
      };
    }

    const keyName = `db-backups/mongodb/full-backup-${new Date()
      .toISOString()
      .replace(/:/g, "-")}.json`;

    const uploadedKey = await this.uploadService.uploadToCloud(
      file.buffer,
      keyName,
      file.mimetype,
    );

    console.log("=======================================");
    console.log("MONGODB BACKUP UPLOADED TO S3");
    console.log("S3 KEY:", uploadedKey);
    console.log("FULL URL:", this.buildPublicUrl(uploadedKey));
    console.log("DATE:", new Date());
    console.log("=======================================");

    return {
      success: true,
      message: "Database backup uploaded successfully",
      key: uploadedKey,
      url: this.buildPublicUrl(uploadedKey),
    };
  }
}
