import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserSignUpResponseDto {
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
  signUpType!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class UserSignInResponseDto {
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
  signUpType!: string;
}

export class AdminSignInResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  isEmailVerified!: boolean;

  @ApiProperty()
  signUpType!: string;
}
