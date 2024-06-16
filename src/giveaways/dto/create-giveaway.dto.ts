import { IsNumber, IsString, Min } from 'class-validator';

export class CreateGiveawayDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  ownerId: number;
}
