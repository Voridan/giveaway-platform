import { Expose, Transform } from 'class-transformer';

export class AuthResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  id: string;

  @Expose()
  email: string;

  @Expose()
  userName: string;

  @Expose()
  isAdmin: boolean;

  @Expose()
  accessToken: string;
}
