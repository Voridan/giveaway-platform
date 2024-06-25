import { Expose } from 'class-transformer';
import { GiveawayDto } from './giveaway.dto';

export class PaginationResponseDto {
  @Expose()
  giveaways: GiveawayDto[];

  @Expose()
  total: number;

  @Expose()
  lastId: number;

  constructor(_giveaways: GiveawayDto[], _total: number) {
    this.giveaways = _giveaways;
    this.total = _total;
  }
}
