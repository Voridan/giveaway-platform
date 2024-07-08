import { Expose } from 'class-transformer';

export class GiveawayBaseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

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
}
