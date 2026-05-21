import {
  Global,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";

@Global()
@Injectable()
export class UploadService {
  private readonly logger = new Logger("UploadService");
  private readonly s3?: S3Client;
  private readonly bucket?: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>("AWS_REGION");
    const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>(
      "AWS_SECRET_ACCESS_KEY",
    );
    const bucket = this.configService.get<string>("AWS_BUCKET_NAME");

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      this.logger.warn(
        "AWS S3 is not configured. Upload endpoints will be unavailable.",
      );
      return;
    }

    this.bucket = bucket;
    this.s3 = new S3Client({
      region,
      endpoint: `https://s3.${region}.amazonaws.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  private getClient(): { s3: S3Client; bucket: string } {
    if (!this.s3 || !this.bucket) {
      throw new ServiceUnavailableException("AWS S3 is not configured");
    }

    return { s3: this.s3, bucket: this.bucket };
  }

  async uploadFile(
    file: Express.Multer.File | Buffer,
    path: string,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    if (!file) {
      this.logger.error("No file found");
      throw new Error("File is required");
    }

    const key = `${path}/${fileName}`;
    return this.uploadToCloud(file, key, mimeType);
  }

  async uploadToCloud(
    file: Express.Multer.File | Buffer,
    keyName: string,
    mimeType: string,
  ): Promise<string> {
    const { s3, bucket } = this.getClient();
    const uploadParams = {
      Bucket: bucket,
      Key: keyName,
      Body:
        file instanceof Buffer
          ? file
          : Buffer.from(file.buffer as unknown as ArrayBufferLike),
      ContentType: mimeType,
      ContentDisposition: `inline; filename="${keyName.split("/").pop()}"`,
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      this.logger.debug("File uploaded to S3: " + keyName);
      return keyName;
    } catch (err) {
      this.logger.error("Error uploading to S3:", err);
      throw new Error("Error uploading to S3: " + (err?.message || err));
    }
  }

  async deleteFromCloud(keyName: string): Promise<boolean> {
    this.logger.debug(`Checking if file exists in cloud: ${keyName}`);
    const { s3, bucket } = this.getClient();

    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: keyName,
        }),
      );

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: keyName,
        }),
      );

      this.logger.debug("File deleted successfully from S3");
      return true;
    } catch (err: any) {
      if (err.name === "NotFound") {
        this.logger.warn("File not found in S3");
        throw new NotFoundException("File does not exist in cloud storage");
      }

      this.logger.error("Error deleting from S3: ", err);
      throw new Error("Error deleting file: " + (err?.message || err));
    }
  }
}
