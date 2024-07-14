import { CollectParticipantsEvent, Participant } from '@app/common';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GiveawayTypeOrmRepository } from 'apps/giveaway-partnership/src/repository/giveaway.typeorm-repository';
import * as ref from 'instagram-id-to-url-segment';

@Injectable()
export class ParticipantsCollectorService {
  constructor(
    private readonly config: ConfigService,
    private readonly giveawaysRepo: GiveawayTypeOrmRepository,
  ) {}

  async collectInstagramParticipants(eventData: CollectParticipantsEvent) {
    const postId = this.extractPostId(eventData.postUrl);

    if (postId) {
      const mediaId = ref.urlSegmentToInstagramId(postId);

      let hasNextPage = true;
      let nextMinId = null;
      const apikey = this.config.get<string>('RAPID_API_KEY');
      while (hasNextPage) {
        const url = `https://rocketapi-for-instagram.p.rapidapi.com/instagram/media/get_comments`;
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'x-rapidapi-key': apikey,
              'x-rapidapi-host': 'rocketapi-for-instagram.p.rapidapi.com',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: mediaId,
              min_id: nextMinId,
              can_support_threading: false,
            }),
          });

          if (!response.ok) {
            throw new HttpException(
              'Server error',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          const body = await response.json();
          const data = body.response.body;

          const nicknames = data.comments.map(
            (item) => item.user.username,
          ) as string[];
          const unified = Array.from(new Set(nicknames));

          const participants = unified.map((nickname) => {
            const participant = new Participant({
              nickname: nickname,
            });
            return participant;
          });

          const giveaway = await this.giveawaysRepo.findOne({
            id: eventData.giveawayId,
          });
          giveaway.participants.push(...participants);
          giveaway.participantsCount += participants.length;
          await this.giveawaysRepo.save(giveaway);

          nextMinId = data.next_min_id;
          hasNextPage = nextMinId ?? false;
        } catch (error) {
          console.error('Fetch exception: ', error.message);
          break;
        }
      }
    }
  }

  private extractPostId(postUrl: string) {
    const match = postUrl.match(/(?<=p\/)([^\/]+)/g);
    return match ? match[0] : '';
  }
}
