import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export class UserProfileDto {
  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;
}

export class UserProfileDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  number?: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  isEmailVerified!: boolean;

  @ApiProperty()
  isNumberVerified!: boolean;

  @ApiProperty()
  isProfileSetup!: boolean;

  @ApiProperty()
  signUpType!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: UserProfileDto })
  profile!: UserProfileDto;
}
