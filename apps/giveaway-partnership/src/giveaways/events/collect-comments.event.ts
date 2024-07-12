export class CollectCommentsEvent {
  constructor(
    public readonly giveawayId: string,
    public readonly postUrl: string,
  ) {}
}
