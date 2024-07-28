import { getApproveMail } from './util/get-approve-mail';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { CollectParticipantsEvent, PrismaService } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { getDeclineMail } from './util/get-decline-mail';

@Injectable()
export class GiveawaysService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @Inject('participants-microservice')
    private readonly participantsClient: ClientProxy,
  ) {}

  async onModuleInit() {
    const giveaways = await this.prismaService.giveaway.findMany({
      include: { _count: { select: { participants: true } } },
    });

    for (const giveaway of giveaways) {
      await this.prismaService.giveaway.update({
        where: { id: giveaway.id },
        data: { participantsCount: giveaway._count.participants },
      });
    }
    console.log('Updated participant counts for all giveaways on startup');
  }

  async create(giveawayDto: CreateGiveawayDto, userId: number) {
    const owner = await this.usersService.findById(userId);
    if (!owner) {
      throw new BadRequestException('Owner not found.');
    }
    const { title, description, postUrl, participants, partnersIds } =
      giveawayDto;

    const participantsArr = participants?.length
      ? participants
          .trim()
          .split(' ')
          .map((participant) => ({
            name: participant,
          }))
      : [];

    const partnersIdsArr = partnersIds?.length
      ? partnersIds
          .trim()
          .split(' ')
          .map((partnerId) => ({ id: +partnerId }))
      : [];

    return this.prismaService.giveaway.create({
      data: {
        title,
        description,
        postUrl,
        owner: {
          connect: { id: owner.id },
        },
        participantsCount: participantsArr.length,
        participants: {
          create: participantsArr,
        },
        partners: {
          connect: partnersIdsArr,
        },
      },
      include: {
        partners: true,
      },
    });
  }

  async moderateApprove(id: number) {
    const updated = await this.prismaService.giveaway.update({
      where: { id },
      data: {
        onModeration: false,
      },
      include: {
        owner: {
          select: {
            email: true,
          },
        },
      },
    });
    const ownerEmail = updated.owner.email;

    const mail = getApproveMail(ownerEmail, updated.title);
    await this.mailService.sendEmail({
      from: this.config.get<string>('APP_MAIL'),
      to: ownerEmail,
      subject: 'Moderation',
      html: mail,
    });

    return updated;
  }

  async moderateDelete(id: number) {
    const toDelete = await this.prismaService.giveaway.findUnique({
      where: { id },
      include: {
        owner: {
          select: { email: true },
        },
      },
    });
    if (!toDelete) throw new NotFoundException('Giveaway not found');

    await this.remove(toDelete.id);
    const ownerEmail = toDelete.owner.email;

    const mail = getDeclineMail(ownerEmail, toDelete.title);
    await this.mailService.sendEmail({
      from: this.config.get<string>('APP_MAIL'),
      to: ownerEmail,
      subject: 'Moderation',
      html: mail,
    });

    return toDelete;
  }

  async findById(id: number) {
    const giveaway = await this.prismaService.giveaway.findUnique({
      where: { id },
      include: {
        partners: true,
      },
    });

    return giveaway;
  }

  async update(id: number, body: UpdateGiveawayDto) {
    const toUpdate = await this.prismaService.giveaway.findUnique({
      where: { id },
      include: {
        partners: true,
      },
    });
    const { title, description, postUrl, participants, partnersIds } = body;
    const participantsArr = participants?.length
      ? participants
          .trim()
          .split(' ')
          .map((name) => ({ name }))
      : [];

    const partnersIdsSet = partnersIds?.length
      ? new Set(
          partnersIds
            .trim()
            .split(' ')
            .map((strId) => +strId),
        )
      : new Set([]);
    const oldPartnersIds = toUpdate.partners.map((partner) => partner.id);
    const difference: number[] = [];

    if (partnersIdsSet) {
      for (const pId of oldPartnersIds) {
        if (!partnersIdsSet.has(pId)) {
          difference.push(pId);
        }
      }
    }

    return this.prismaService.giveaway.update({
      where: { id },
      data: {
        title,
        description,
        postUrl,
        participantsCount: {
          increment: participantsArr.length,
        },
        participants: {
          create: participantsArr,
        },
        partners: {
          connect: [...partnersIdsSet.values()].map((id) => ({ id })),
          disconnect: difference.map((id) => ({ id })),
        },
      },
      include: {
        partners: true,
      },
    });
  }

  end(id: number) {
    return this.prismaService.giveaway.update({
      where: { id },
      data: { ended: true },
    });
  }

  async remove(id: number) {
    return this.prismaService.giveaway.delete({ where: { id } });
  }

  async getResult(id: number) {
    const giveaway = await this.prismaService.giveaway.findUnique({
      where: { id },
      include: {
        participants: true,
        winner: {
          include: {
            participant: true,
          },
        },
      },
    });

    const results = new GiveawayResultDto();
    results.participants = giveaway.participants?.map((p) => p.name);
    results.winner = giveaway.winner?.participant?.name || '';

    return results;
  }

  async collectParticipants(
    participantsSourceDto: ParticipantsSourceDto,
    ownerId: number,
  ) {
    const id = participantsSourceDto.giveawayId;
    const giveaway = await this.prismaService.giveaway.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (giveaway.owner?.id !== ownerId) {
      throw new BadRequestException('User does not have such giveaway');
    }
    if (giveaway.onModeration) {
      throw new BadRequestException('Giveaway is on moderation stage');
    }
    if (giveaway.ended) {
      throw new BadRequestException('Giveaway has ended');
    }

    this.participantsClient.emit(
      'collect-comments',
      new CollectParticipantsEvent(giveaway.id, participantsSourceDto.postUrl),
    );
  }

  addParticipants(id: number, addParticipantsDto: AddParticipantsDto) {
    const participants = addParticipantsDto.data
      .trim()
      .split(' ')
      .map((item) => ({ name: item }));

    return this.prismaService.giveaway.update({
      where: { id },
      data: {
        participants: {
          create: participants,
        },
        participantsCount: {
          increment: participants.length,
        },
      },
    });
  }

  searchGiveaways(query: string) {
    return this.prismaService
      .$queryRaw`SELECT * FROM search_giveaways(${query});`;
  }

  async getUnmoderatedGiveaways(limit: number, lastItemId: number) {
    if (lastItemId !== undefined && lastItemId > 0) {
      const item = await this.prismaService.giveaway.findUnique({
        where: {
          id: lastItemId,
        },
      });
      if (!item) {
        throw new BadRequestException('Last item id is invalid.');
      }
    }
    const [giveaways, totalCount] = await this.prismaService.$transaction([
      this.prismaService.giveaway.findMany({
        where: { AND: [{ id: { gt: lastItemId } }, { onModeration: true }] },
        orderBy: { id: 'asc' },
        take: limit,
      }),
      this.prismaService.giveaway.count({
        where: { onModeration: true },
      }),
    ]);

    return [giveaways, totalCount] as const;
  }

  async getPartneredPaginatedGiveaways(
    partnerId: number,
    offset: number,
    limit: number,
    lastItemId: number,
    forward: boolean = true,
  ) {
    const [giveaways, totalCount] = await this.prismaService.$transaction([
      this.prismaService.giveaway.findMany({
        where: {
          id: forward ? { gt: lastItemId } : { lt: lastItemId },
          partners: {
            some: {
              id: partnerId,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: {
          id: 'asc',
        },
      }),
      this.prismaService.giveaway.count({
        where: {
          partners: {
            some: {
              id: partnerId,
            },
          },
        },
      }),
    ]);

    !forward && giveaways.sort((g1, g2) => g1.id - g2.id);
    return [giveaways, totalCount] as const;
  }

  async getOwnPaginatedGiveaways(
    userId: number,
    offset: number,
    limit: number,
    lastItemId: number,
    forward: boolean = true,
  ) {
    const [giveaways, totalCount] = await this.prismaService.$transaction([
      this.prismaService.giveaway.findMany({
        where: {
          id: forward ? { gt: lastItemId } : { lt: lastItemId },
          ownerId: userId,
        },
        skip: offset,
        take: limit,
        orderBy: {
          id: 'asc',
        },
      }),
      this.prismaService.giveaway.count({
        where: {
          ownerId: userId,
        },
      }),
    ]);

    !forward && giveaways.sort((g1, g2) => g1.id - g2.id);
    return [giveaways, totalCount] as const;
  }
}
