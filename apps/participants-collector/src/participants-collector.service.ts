import { CollectParticipantsEvent } from '@app/common/events/collect-participants.event';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GiveawayMongooseRepository } from 'apps/giveaway-partnership/src/repository/giveaway.mongoose-repository';
import * as ref from 'instagram-id-to-url-segment';

@Injectable()
export class ParticipantsCollectorService {
  constructor(
    private readonly config: ConfigService,
    private readonly giveawaysRepo: GiveawayMongooseRepository,
  ) {}

  async collectInstagramComments(eventData: CollectParticipantsEvent) {
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
          await this.giveawaysRepo.findOneAndUpdate(
            { _id: eventData.giveawayId },
            {
              $inc: { participantsCount: unified.length },
              $push: { participants: unified },
            },
          );
          nextMinId = data.next_min_id;
          hasNextPage = nextMinId ?? false;
        } catch (error) {
          console.error('Fetch exception: ', error.message);
          break;
        }
      }
    }
  }

  extractPostId(postUrl: string) {
    const match = postUrl.match(/(?<=p\/)([^\/]+)/g);
    return match ? match[0] : '';
  }
}
