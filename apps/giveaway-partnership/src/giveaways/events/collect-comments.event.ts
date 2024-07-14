import { Giveaway } from '@app/common';

export class CollectCommentsEvent {
  constructor(
    public readonly giveaway: Giveaway,
    public readonly postUrl: string,
  ) {}
}
