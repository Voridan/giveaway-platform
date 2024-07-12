export class CollectParticipantsEvent {
  constructor(
    public readonly giveawayId: string,
    public readonly postUrl: string,
  ) {}
}
