import { IsString } from 'class-validator';

export class AddParticipantsDto {
  @IsString()
  data: string;
}
