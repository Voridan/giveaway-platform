import { Expose } from 'class-transformer';

export class PartnerDto {
  @Expose()
  id: number;

  @Expose()
  email: string;
}
