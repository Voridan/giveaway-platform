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
  @Matches(/^[\w]+( [\w]+)*$/, {
    message: `Participants must be space-separated nicknames`,
  })
  participants?: string;

  @IsString()
  @IsOptional()
  @Matches(/^https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)\/?$/, {
    message: `Participants must be space-separated nicknames`,
  })
  postUrl?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\d]+( \d+)*$/, {
    message: "partners' ids must be a string of numbers separeted by a space",
  })
  partnersIds?: string;
}
