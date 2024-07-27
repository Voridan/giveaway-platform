import { Expose, Transform } from 'class-transformer';

export class PartnerDto {
  @Expose()
  @Transform(({ obj }) => obj.userId)
  id: string;

  @Expose()
  email: string;
}
