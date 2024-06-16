import { Expose, Transform } from 'class-transformer';

export class GiveawayDto {
  @Expose()
  giveawayId: number;

  @Expose()
  title: string;

  @Expose()
  imageUrl: string;

  @Expose()
  price: number;

  @Expose()
  onModeration: boolean;

  @Expose()
  ended: boolean;

  @Expose()
  createdAt: Date;

  @Transform(({ obj }) => obj.owner.userId)
  @Expose()
  ownerId: number;

  @Transform(({ obj }) => obj.winner?.participantId)
  @Expose()
  winnerId: number;
}
