import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class CreateGiveawayDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string | undefined;

  @IsOptional()
  @IsUrl()
  postUrl: string | undefined;

  @IsOptional()
  @IsString()
  @Matches(/^[\w]+( [\w]+)*$/, {
    message: `Participants must be space-separated nicknames`,
  })
  participants: string | undefined;

  @IsOptional()
  @IsString()
  @Matches(/^[a-f\d]{24}( [a-f\d]{24})*$/, {
    message: `Partners' ids must be space-separated ObjectIds`,
  })
  partnersIds: string | undefined;
}
