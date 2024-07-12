import { IsString, IsUrl } from 'class-validator';

export class ParticipantsSourceDto {
  @IsString()
  giveawayId: string;

  @IsUrl()
  postUrl: string;
}
