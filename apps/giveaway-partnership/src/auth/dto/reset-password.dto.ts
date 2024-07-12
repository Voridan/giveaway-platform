import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  secret: string;

  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;
}
