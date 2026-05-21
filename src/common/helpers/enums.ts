export enum UserRoleEnum {
  ADMIN = "admin",
  USER = "user",
}

export enum LoginTypeEnum {
  GOOGLE = "google",
  APPLE = "apple",
  EMAIL = "email",
  NUMBER = "number",
}

export enum ActionEnum {
  UNVERIFIED = "unverified",
  INCOMPLETE_PROFILE = "incompleteProfile",
  LOGIN_GRANTED = "loginGranted",
  BLOCKED = "blocked",
}

export enum OtpTypeEnum {
  EMAIL_VERIFICATION = "emailVerification",
  NUMBER_VERIFICATION = "numberVerification",
  GENERAL_VERIFICATION = "generalVerification",
  PASSWORD_RESET = "passwordReset",
}

export enum SocialLoginTypeEnum {
  GOOGLE = "google",
  APPLE = "apple",
}

export enum JwtExpireTime {
  LONG_TERM = "30d",
  DEFAULT = "1d",
}

export const FileUploadConstants = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/JPEG",
    "image/JPG",
    "image/PNG",
    "image/WEBP",
    "image/heif",
    "application/octet-stream",
  ],
  ALLOWED_BACKUP_TYPES: ["application/json", "application/octet-stream"],
};
