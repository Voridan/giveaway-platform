import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  userName: string;

  @IsString()
  password: string;

  @IsEmail()
  email: string;

  @IsBoolean()
  isAdmin: boolean = false;
}
