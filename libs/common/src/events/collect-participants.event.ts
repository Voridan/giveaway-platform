export class CollectParticipantsEvent {
  constructor(
    public readonly giveawayId: number,
    public readonly postUrl: string,
  ) {}
}
