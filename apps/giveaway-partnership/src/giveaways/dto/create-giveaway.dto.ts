import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class CreateGiveawayDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string | undefined;

  @IsOptional()
  @IsString()
  participants: string | undefined;

  @IsOptional()
  @IsUrl()
  postUrl: string | undefined;

  @IsOptional()
  @IsString()
  @Matches(/^\d+( \d+)*$/, {
    message: `Partners' ids must be space-separated number IDs`,
  })
  partnerIds: string | undefined;
}
