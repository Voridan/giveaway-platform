import { Expose } from 'class-transformer';

export class GiveawayResultDto {
  @Expose()
  participants: string;

  @Expose()
  winner: string;
}
