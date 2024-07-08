import { Expose } from 'class-transformer';

export class AuthResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  userName: string;

  @Expose()
  isAdmin: boolean;

  @Expose()
  accessToken: string;
}
