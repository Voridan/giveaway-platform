import { IsBoolean } from 'class-validator';

export class ModerateGiveawayDto {
  @IsBoolean()
  onModeration: boolean;
}
