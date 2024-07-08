import { Expose, Type } from 'class-transformer';
import { PartnerDto } from './partner.dto';

export class GiveawayDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string | null;

  @Expose()
  postUrl: string | null;

  @Expose()
  imageUrl: string | null;

  @Expose()
  onModeration: boolean;

  @Expose()
  ended: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  participantsCount: number;

  @Expose()
  @Type(() => PartnerDto)
  partners: PartnerDto[];
}
