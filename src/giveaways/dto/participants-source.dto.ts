import { IsNumber, IsUrl } from 'class-validator';

export class ParticipantsSourceDto {
  @IsNumber()
  giveawayId: number;

  @IsUrl()
  postUrl: string;
}
