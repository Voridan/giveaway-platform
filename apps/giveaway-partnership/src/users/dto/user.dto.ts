import { Expose, Transform } from 'class-transformer';

export class UserDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  id: number;

  @Expose()
  email: string;

  @Expose()
  userName: string;

  @Expose()
  isAdmin: boolean;
}
