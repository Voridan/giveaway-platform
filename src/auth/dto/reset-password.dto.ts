import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  secret: string;

  @IsString()
  newPassword: string;
}
