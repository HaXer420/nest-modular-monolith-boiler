import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsLowercase,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  MinLength,
  Min,
  ValidateNested,
} from "class-validator";
import {
  LoginTypeEnum,
  OtpTypeEnum,
  SocialLoginTypeEnum,
  UserRoleEnum,
} from "src/common/helpers/enums";

export class DeviceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;

  @ApiProperty({ type: DeviceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceDto)
  device!: DeviceDto;
}

export class LogoutDto {
  @ApiProperty({ type: DeviceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceDto)
  device!: DeviceDto;
}

export class SignUpDto {
  @ApiProperty()
  @IsOptional()
  @IsLowercase()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;

  @ApiProperty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    enum: [UserRoleEnum.USER],
    example: UserRoleEnum.USER,
  })
  @IsNotEmpty()
  @IsIn([UserRoleEnum.USER], {
    message: "Role must be user",
  })
  role!: Exclude<UserRoleEnum, UserRoleEnum.ADMIN>;
}

export class LoginDto {
  @ApiProperty()
  @IsOptional()
  @IsLowercase()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;

  @ApiProperty({
    enum: [UserRoleEnum.USER],
    example: UserRoleEnum.USER,
  })
  @IsNotEmpty()
  @IsIn([UserRoleEnum.USER], {
    message: "Role must be user",
  })
  role!: Exclude<UserRoleEnum, UserRoleEnum.ADMIN>;

  @ApiProperty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ type: DeviceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceDto)
  device!: DeviceDto;
}

export class TestLoginDto {
  @ApiProperty()
  @IsOptional()
  @IsLowercase()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;

  @ApiProperty()
  @MinLength(8)
  password!: string;
}

export class OtpSendDto {
  @ApiProperty()
  @IsOptional()
  @IsLowercase()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;

  @ApiProperty({
    enum: OtpTypeEnum,
    example: OtpTypeEnum.EMAIL_VERIFICATION,
  })
  @IsNotEmpty()
  @IsEnum(OtpTypeEnum, { message: "Invalid OTP purpose" })
  purpose!: OtpTypeEnum;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @ApiProperty()
  @Min(1000, { message: "OTP must be equal to 4 digits" })
  @Max(9999, { message: "OTP must be equal to 4 digits" })
  otp!: number;

  @ApiProperty()
  @IsOptional()
  @IsLowercase()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;
}

export class VerifyAuthOtpDto extends VerifyOtpDto {
  @ApiProperty({ type: DeviceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceDto)
  device!: DeviceDto;
}

export class ForgotPasswordDto {
  @IsOptional()
  @IsEmail()
  @ApiProperty()
  email!: string;

  @ApiProperty({
    enum: [UserRoleEnum.USER],
    example: UserRoleEnum.USER,
  })
  @IsNotEmpty()
  @IsIn([UserRoleEnum.USER], {
    message: "Role must be user",
  })
  role!: Exclude<UserRoleEnum, UserRoleEnum.ADMIN>;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;
}

export class ResetPasswordDto {
  @IsOptional()
  @IsEmail()
  @ApiProperty()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber()
  number!: string;

  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @ApiProperty()
  @Min(1000, { message: "OTP must be equal to 4 digits" })
  @Max(9999, { message: "OTP must be equal to 4 digits" })
  otp!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AdminLoginDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ type: DeviceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceDto)
  device!: DeviceDto;
}

export class SocialAuthDto {
  @ApiProperty({ example: "Token" })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({
    enum: [UserRoleEnum.USER],
    example: UserRoleEnum.USER,
  })
  @IsNotEmpty()
  @IsIn([UserRoleEnum.USER], {
    message: "Role must be user",
  })
  role!: Exclude<UserRoleEnum, UserRoleEnum.ADMIN>;

  @ApiProperty({
    example: "google",
    enum: [LoginTypeEnum.APPLE, LoginTypeEnum.GOOGLE],
  })
  @IsNotEmpty()
  @IsIn([LoginTypeEnum.APPLE, LoginTypeEnum.GOOGLE], {
    message: "Invalid login type",
  })
  type!: LoginTypeEnum.APPLE | LoginTypeEnum.GOOGLE;

  @ApiProperty({ type: DeviceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceDto)
  device!: DeviceDto;
}
