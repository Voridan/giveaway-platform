import { IsOptional, IsString } from 'class-validator';

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
  participants?: string;

  @IsString()
  @IsOptional()
  postUrl?: string;

  @IsString()
  @IsOptional()
  partnersIds?: string;
}
