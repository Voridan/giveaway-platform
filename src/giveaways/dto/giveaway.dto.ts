import { Expose } from 'class-transformer';

export class GiveawayDto {
  @Expose()
  id: number;

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

  @Expose()
  ownerId: number;

  @Expose()
  winnerId: number;
}
