import { Expose, Transform } from 'class-transformer';

export class GiveawayBaseDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  id: string;

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
