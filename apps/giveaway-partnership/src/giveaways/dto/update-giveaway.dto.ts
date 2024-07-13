import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateGiveawayDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  postUrl?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\w]+( [\w]+)*$/, {
    message: `Participants must be space-separated nicknames`,
  })
  participants?: string;

  @IsString()
  @IsOptional()
  @Matches(/^$|^[a-f\d]{24}( [a-f\d]{24})*$/, {
    message: `Partners' ids must be space-separated ObjectIds`,
  })
  partnersIds?: string;
}
