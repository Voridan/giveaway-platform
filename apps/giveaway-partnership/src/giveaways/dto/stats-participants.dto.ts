import { Expose } from 'class-transformer';

export class StatsParticipantsDto {
  @Expose()
  title: string;

  @Expose()
  participantsCount: number;
}
