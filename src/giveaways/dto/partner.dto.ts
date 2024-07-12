import { Expose, Transform } from 'class-transformer';

export class PartnerDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  id: string;

  @Expose()
  email: string;
}
