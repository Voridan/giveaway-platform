import { IsString } from 'class-validator';

export class UpdateGiveawayDto {
  @IsString()
  title: string;
}
