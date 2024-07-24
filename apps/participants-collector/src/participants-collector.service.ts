import { CollectParticipantsEvent, Participant } from '@app/common';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ref from 'instagram-id-to-url-segment';
import { GiveawayTypeOrmRepository } from './repository/giveaway.typeorm-repository';

@Injectable()
export class ParticipantsCollectorService {
  constructor(
    private readonly config: ConfigService,
    private readonly giveawaysRepo: GiveawayTypeOrmRepository,
  ) {}

  async collectInstagramParticipants(eventData: CollectParticipantsEvent) {
    const postId = this.extractPostId(eventData.postUrl);
    console.log(postId);

    if (postId) {
      const mediaId = ref.urlSegmentToInstagramId(postId);
      const participantsSet = new Set<string>();
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
          console.log('data', data);

          const nicknames = data.comments.map(
            (item) => item.user.username,
          ) as string[];

          for (const nickname of nicknames) participantsSet.add(nickname);

          nextMinId = data.next_min_id;
          hasNextPage = nextMinId ?? false;
        } catch (error) {
          console.error('Fetch exception: ', error.message);
          break;
        }
      }
      try {
        console.log([...participantsSet.values()]);
        const start = performance.now();
        const participants = [...participantsSet.values()].map((nickname) => {
          const participant = new Participant({
            nickname: nickname,
          });
          return participant;
        });
        console.log('converted in: ', performance.now() - start, 'ms');
        const startWrite = performance.now();
        const giveaway = await this.giveawaysRepo.findOne(
          {
            id: eventData.giveawayId,
          },
          { participants: true },
        );
        giveaway.participants.push(...participants);
        giveaway.participantsCount += participants.length;
        await this.giveawaysRepo.save(giveaway);
        console.log('wrote in: ', performance.now() - startWrite, 'ms');
      } catch (error) {
        console.error(error.message);
      }
    }
  }

  private extractPostId(postUrl: string) {
    const match = postUrl.match(/(?<=p\/)([^\/]+)/g);
    return match ? match[0] : '';
  }
}
