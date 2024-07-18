import { Test, TestingModule } from '@nestjs/testing';
import { GiveawaysService } from './giveaways.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { GiveawayTypeOrmRepository } from '../repository/giveaway.typeorm-repository';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { BadRequestException } from '@nestjs/common';
import {
  CollectParticipantsEvent,
  Giveaway,
  Participant,
  User,
} from '@app/common';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { ClientProxy } from '@nestjs/microservices';
import { AddParticipantsDto } from './dto/add-participants.dto';

describe('GiveawaysService', () => {
  let service: GiveawaysService;
  let mockUsersService: Pick<
    jest.MockedObject<UsersService>,
    'findManyById' | 'findById'
  >;
  let mockMailService: Pick<jest.MockedObject<MailService>, 'sendEmail'>;
  let mockRepository: Pick<
    jest.MockedObject<GiveawayTypeOrmRepository>,
    | 'find'
    | 'save'
    | 'findOneAndUpdate'
    | 'findOne'
    | 'findOneAndDelete'
    | 'getUnmoderatedByLastId'
  >;
  let mockParticipantsClient: jest.Mocked<ClientProxy>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiveawaysService,
        {
          provide: GiveawayTypeOrmRepository,
          useValue: {
            save: jest.fn(),
            findOneAndUpdate: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndDelete: jest.fn(),
            getUnmoderatedByLastId: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findManyById: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: 'participants-microservice',
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GiveawaysService>(GiveawaysService);
    mockUsersService = module.get(UsersService);
    mockMailService = module.get(MailService);
    mockRepository = module.get(GiveawayTypeOrmRepository);
    mockParticipantsClient = module.get('participants-microservice');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if wrong user id was provided', async () => {
      const userId = 123;
      const createGiveawayDto: CreateGiveawayDto = {
        title: 'Giveaway Title',
        description: 'Giveaway Description',
        postUrl: 'http://example.com',
        participants: 'participant1 participant2',
        partnerIds: '1 2',
      };

      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.create(createGiveawayDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
    });

    it('should create giveaway without participants and partners', async () => {
      const createGiveawayDto: CreateGiveawayDto = {
        title: 'Giveaway Title',
        description: 'Giveaway Description',
        postUrl: 'http://example.com',
      };
      const userId = 123;
      const owner = { id: userId, email: 'test@test.com' } as User;
      mockUsersService.findById.mockResolvedValue(owner);
      mockRepository.save.mockResolvedValue({
        id: 100,
        ...createGiveawayDto,
        owner,
      } as unknown as Giveaway);

      const res = await service.create(createGiveawayDto, userId);

      expect(res).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: 'Giveaway Title',
          description: 'Giveaway Description',
          postUrl: 'http://example.com',
          owner,
        }),
      );
    });

    it('should create giveaway with partners', async () => {
      const userId = 123;
      const createGiveawayDto: CreateGiveawayDto = {
        title: 'Giveaway Title',
        description: 'Giveaway Description',
        postUrl: 'http://example.com',
        partnerIds: '1 2',
      };
      const owner = { id: userId, email: 'test@test.com' } as User;
      mockUsersService.findById.mockResolvedValue(owner);
      mockRepository.save.mockResolvedValue({
        id: 100,
        title: 'Giveaway Title',
        description: 'Giveaway Description',
        postUrl: 'http://example.com',
        owner,
        partners: [
          { id: 1, userName: 'partner1' },
          { id: 2, userName: 'partner2' },
        ],
      } as unknown as Giveaway);
      mockUsersService.findManyById.mockResolvedValue([
        { id: 1, userName: 'partner1' },
        { id: 2, userName: 'partner2' },
      ] as User[]);

      const res = await service.create(createGiveawayDto, userId);

      expect(mockUsersService.findManyById).toHaveBeenCalledWith(
        createGiveawayDto.partnerIds.trim().split(' ').map(Number),
      );
      expect(res).toEqual(
        expect.objectContaining({
          id: 100,
          title: 'Giveaway Title',
          description: 'Giveaway Description',
          postUrl: 'http://example.com',
          owner,
          partners: [
            { id: 1, userName: 'partner1' },
            { id: 2, userName: 'partner2' },
          ],
        }),
      );
    });

    it('should throw if partners ids are invalid', async () => {
      const userId = 123;
      const createGiveawayDto: CreateGiveawayDto = {
        title: 'Giveaway Title',
        description: 'Giveaway Description',
        postUrl: 'http://example.com',
        partnerIds: '1 2',
      };
      const owner = { id: userId, email: 'test@test.com' } as User;
      mockUsersService.findById.mockResolvedValue(owner);
      mockUsersService.findManyById.mockResolvedValue([]);
      jest.spyOn(service, 'create');
      await expect(service.create(createGiveawayDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersService.findManyById).toHaveBeenCalledWith([1, 2]);
    });

    it('should create giveaway with participants', async () => {
      const userId = 123;
      const createGiveawayDto: CreateGiveawayDto = {
        title: 'Giveaway Title',
        description: 'Giveaway Description',
        postUrl: 'http://example.com',
        participants: 'participant1 participant2',
      };
      const owner = { id: userId, email: 'test@test.com' } as User;
      const participantsEntity = [
        { id: 1, nickname: 'participant1' },
        { id: 2, nickname: 'participant2' },
      ] as Participant[];

      mockUsersService.findById.mockResolvedValue(owner);
      mockUsersService.findManyById.mockResolvedValue([]);
      mockRepository.save.mockResolvedValue({
        ...createGiveawayDto,
        owner,
        participants: participantsEntity,
        participantsCount: participantsEntity.length,
      } as unknown as Giveaway);

      const result = await service.create(createGiveawayDto, userId);

      expect(result).toEqual(
        expect.objectContaining({
          title: 'Giveaway Title',
          description: 'Giveaway Description',
          postUrl: 'http://example.com',
          owner,
          participants: participantsEntity,
          participantsCount: participantsEntity.length,
        }),
      );
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockUsersService.findManyById).not.toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Giveaway Title',
          description: 'Giveaway Description',
          postUrl: 'http://example.com',
          owner,
          participants: [
            { nickname: 'participant1' },
            { nickname: 'participant2' },
          ],
          participantsCount: participantsEntity.length,
        }),
      );
    });
  });

  describe('moderateApprove', () => {
    it('should update onModeration to false and send notification email to the owner', async () => {
      const giveawayId = 1;
      const expectedRes = {
        id: 1,
        title: 'Giveaway title',
        onModeration: false,
        owner: {
          id: 25,
          email: 'test@test.com',
        },
      } as Giveaway;

      mockRepository.findOneAndUpdate.mockResolvedValue(expectedRes);

      const res = await service.moderateApprove(giveawayId);

      expect(mockRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: giveawayId },
        { onModeration: false },
        { owner: true },
      );
      expect(res).toEqual(expect.objectContaining(expectedRes));
      expect(mockMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: expectedRes.owner.email }),
      );
    });
  });

  describe('moderateDelete', () => {
    it('should delete giveaway and send notification email to the owner', async () => {
      const giveawayId = 1;
      const expectedRes = {
        id: 1,
        title: 'Giveaway title',
        onModeration: true,
        owner: {
          id: 25,
          email: 'test@test.com',
        },
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(expectedRes);
      jest.spyOn(service, 'remove');

      const res = await service.moderateDelete(giveawayId);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id: giveawayId },
        { owner: true },
      );
      expect(res).toEqual(expect.objectContaining(expectedRes));
      expect(mockMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: expectedRes.owner.email }),
      );
      expect(service.remove).toHaveBeenCalledWith(giveawayId);
    });
  });

  describe('update', () => {
    it('should should not call findOneAndUpdate title, description and posturl if every is undefined', async () => {
      const id = 1;
      const updateGiveawayDto: UpdateGiveawayDto = {};

      mockRepository.findOne.mockResolvedValue({} as Giveaway);

      await service.update(id, updateGiveawayDto);

      expect(mockRepository.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id },
        { participants: false, partners: false },
      );
    });

    it('should update giveaway successfully without partners and participants', async () => {
      const id = 1;
      const updateGiveawayDto: UpdateGiveawayDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        postUrl: 'http://example.com',
      };

      const updatedGiveaway = {
        ...updateGiveawayDto,
        participants: [],
        participantsCount: 0,
      } as Giveaway;

      mockRepository.findOneAndUpdate.mockResolvedValue(updatedGiveaway);
      mockRepository.save.mockResolvedValue(updatedGiveaway);

      const result = await service.update(id, updateGiveawayDto);

      expect(result).toEqual(updatedGiveaway);
      expect(mockRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id },
        {
          title: 'Updated Title',
          description: 'Updated Description',
          postUrl: 'http://example.com',
        },
        { participants: false, partners: false },
      );
      expect(mockRepository.save).toHaveBeenCalledWith(updatedGiveaway);
    });

    it('should should update giveaway successfully with partners and participants', async () => {
      const id = 1;
      const updateGiveawayDto: UpdateGiveawayDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        postUrl: 'http://example.com',
        partnersIds: '1 2',
        participants: 'participant1 participant2',
      };

      const updatedGiveaway = {
        title: 'Updated Title',
        description: 'Updated Description',
        postUrl: 'http://example.com',
        participants: [],
        participantsCount: 0,
      } as Giveaway;

      const participantsEntity = [
        { id: 1, nickname: 'participant1' },
        { id: 2, nickname: 'participant2' },
      ] as Participant[];

      const partners = [
        { id: 1, userName: 'partner1' },
        { id: 2, userName: 'partner2' },
      ] as User[];

      const expectedResult = {
        ...updatedGiveaway,
        partners,
        participants: participantsEntity,
        participantsCount: participantsEntity.length,
      };

      mockRepository.findOneAndUpdate.mockResolvedValue(updatedGiveaway);
      mockUsersService.findManyById.mockResolvedValue(partners);
      mockRepository.save.mockResolvedValue(expectedResult);

      const result = await service.update(id, updateGiveawayDto);

      expect(result).toEqual(
        expect.objectContaining({
          ...updatedGiveaway,
          participants: participantsEntity,
          participantsCount: participantsEntity.length,
          partners,
        }),
      );
      expect(mockRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id },
        {
          title: 'Updated Title',
          description: 'Updated Description',
          postUrl: 'http://example.com',
        },
        { participants: true, partners: true },
      );
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatedGiveaway,
          participants: participantsEntity.map((p) => ({
            nickname: p.nickname,
          })),
          participantsCount: participantsEntity.length,
          partners,
        }),
      );
    });

    it('should throw if partner ids are invalid', async () => {
      const id = 1;
      const updateGiveawayDto: UpdateGiveawayDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        postUrl: 'http://example.com',
        partnersIds: '1 2',
        participants: 'participant3 participant4',
      };
      const participantsEntity = [
        { id: 1, nickname: 'participant1' },
        { id: 2, nickname: 'participant2' },
      ] as Participant[];

      mockRepository.findOneAndUpdate.mockResolvedValue({
        id,
        ...updateGiveawayDto,
        participants: participantsEntity,
        participantsCount: 2,
      } as unknown as Giveaway);
      mockUsersService.findManyById.mockResolvedValue([]);

      await expect(service.update(id, updateGiveawayDto)).rejects.toThrow(
        new BadRequestException("Invalid partners' ids"),
      );

      expect(mockUsersService.findManyById).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('getResult', () => {
    it('should return participants and winner correctly', async () => {
      const id = 1;
      const mockGiveaway = {
        participants: [
          { nickname: 'participant1' },
          { nickname: 'participant2' },
        ],
        winner: { nickname: 'winner1' },
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(mockGiveaway);

      const result = await service.getResult(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id },
        { participants: true, winner: true },
      );

      expect(result).toEqual({
        participants: ['participant1', 'participant2'],
        winner: 'winner1',
      });
    });

    it('should return empty winner if no winner is found', async () => {
      const id = 1;
      const mockGiveaway = {
        participants: [
          { nickname: 'participant1' },
          { nickname: 'participant2' },
        ],
        winner: null,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(mockGiveaway);

      const result = await service.getResult(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id },
        { participants: true, winner: true },
      );

      expect(result).toEqual({
        participants: ['participant1', 'participant2'],
        winner: '',
      });
    });

    it('should return empty participants if no participants are found', async () => {
      const id = 1;
      const mockGiveaway = {
        participants: [],
        winner: { nickname: 'winner1' },
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(mockGiveaway);

      const result = await service.getResult(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id },
        { participants: true, winner: true },
      );

      expect(result).toEqual({
        participants: [],
        winner: 'winner1',
      });
    });

    it('should return empty participants and winner if none are found', async () => {
      const id = 1;
      const mockGiveaway = {
        participants: [],
        winner: null,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(mockGiveaway);

      const result = await service.getResult(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id },
        { participants: true, winner: true },
      );

      expect(result).toEqual({
        participants: [],
        winner: '',
      });
    });
  });

  describe('collectParticipants', () => {
    it('should throw BadRequestException if the user does not own the giveaway', async () => {
      const participantsSourceDto: ParticipantsSourceDto = {
        giveawayId: 1,
        postUrl: 'http://example.com',
      };
      const ownerId = 123;
      const giveaway = {
        owner: { id: 456 },
        onModeration: false,
        ended: false,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(giveaway);

      await expect(
        service.collectParticipants(participantsSourceDto, ownerId),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { owner: true },
      );
    });

    it('should throw BadRequestException if the giveaway is on moderation', async () => {
      const participantsSourceDto: ParticipantsSourceDto = {
        giveawayId: 1,
        postUrl: 'http://example.com',
      };
      const ownerId = 123;
      const giveaway = {
        owner: { id: ownerId },
        onModeration: true,
        ended: false,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(giveaway);

      await expect(
        service.collectParticipants(participantsSourceDto, ownerId),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { owner: true },
      );
    });

    it('should throw BadRequestException if the giveaway has ended', async () => {
      const participantsSourceDto: ParticipantsSourceDto = {
        giveawayId: 1,
        postUrl: 'http://example.com',
      };
      const ownerId = 123;
      const giveaway = {
        owner: { id: ownerId },
        onModeration: false,
        ended: true,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(giveaway);

      await expect(
        service.collectParticipants(participantsSourceDto, ownerId),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { owner: true },
      );
    });

    it('should emit collect-comments event if all conditions are met', async () => {
      const participantsSourceDto: ParticipantsSourceDto = {
        giveawayId: 1,
        postUrl: 'http://example.com',
      };
      const ownerId = 123;
      const giveaway = {
        id: 1,
        owner: { id: ownerId },
        onModeration: false,
        ended: false,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(giveaway);

      await service.collectParticipants(participantsSourceDto, ownerId);

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { owner: true },
      );
      expect(mockParticipantsClient.emit).toHaveBeenCalledWith(
        'collect-comments',
        new CollectParticipantsEvent(1, participantsSourceDto.postUrl),
      );
    });
  });

  describe('addParticipants', () => {
    it('should add participants to the giveaway', async () => {
      const giveawayId = 1;
      const addParticipantsDto: AddParticipantsDto = {
        data: 'participant1 participant2',
      };
      const existingParticipants = [{ id: 1, nickname: 'existingParticipant' }];
      const giveaway = {
        id: giveawayId,
        participants: existingParticipants,
        participantsCount: 1,
      } as Giveaway;

      const newParticipants = [
        { nickname: 'participant1' },
        { nickname: 'participant2' },
      ] as Participant[];

      const expectedResult = {
        id: giveawayId,
        participants: [
          existingParticipants,
          { ...newParticipants[0], id: 2 },
          { ...newParticipants[1], id: 3 },
        ],
        participantsCount: 3,
      } as Giveaway;

      mockRepository.findOne.mockResolvedValue(giveaway);
      jest
        .spyOn(service, 'mapParticipantsToEntity')
        .mockReturnValue(newParticipants);

      mockRepository.save.mockResolvedValue(expectedResult);

      const result = await service.addParticipants(
        giveawayId,
        addParticipantsDto,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: giveawayId });
      expect(service.mapParticipantsToEntity).toHaveBeenCalledWith(
        addParticipantsDto.data,
      );
      expect(result.participantsCount).toBe(3);
      expect(mockRepository.save).toHaveBeenCalledWith(giveaway);
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error if the giveaway is not found', async () => {
      const giveawayId = 1;
      const addParticipantsDto: AddParticipantsDto = {
        data: 'participant1 participant2',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addParticipants(giveawayId, addParticipantsDto),
      ).rejects.toThrow('Giveaway not found');
      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: giveawayId });
    });
  });

  describe('getUnmoderatedGiveaways', () => {
    it('should fetch unmoderated giveaways without last item id', async () => {
      const limit = 10;
      const lastItemId = undefined;
      const unmoderatedGiveaways = [
        { id: 1, title: 'Giveaway 1' },
        { id: 2, title: 'Giveaway 2' },
      ] as Giveaway[];
      mockRepository.getUnmoderatedByLastId.mockResolvedValue([
        unmoderatedGiveaways,
        2,
      ]);

      const result = await service.getUnmoderatedGiveaways(limit, lastItemId);

      expect(mockRepository.getUnmoderatedByLastId).toHaveBeenCalledWith(
        limit,
        lastItemId,
      );
      expect(result).toEqual(expect.arrayContaining([unmoderatedGiveaways, 2]));
    });

    it('should fetch unmoderated giveaways with valid last item id', async () => {
      const limit = 10;
      const lastItemId = 1;
      const item = { id: lastItemId, title: 'Last Giveaway' } as Giveaway;
      const unmoderatedGiveaways = [
        { id: 2, title: 'Giveaway 2' },
        { id: 3, title: 'Giveaway 3' },
      ] as Giveaway[];
      mockRepository.findOne.mockResolvedValue(item);
      mockRepository.getUnmoderatedByLastId.mockResolvedValue([
        unmoderatedGiveaways,
        2,
      ]);

      const result = await service.getUnmoderatedGiveaways(limit, lastItemId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: lastItemId });
      expect(mockRepository.getUnmoderatedByLastId).toHaveBeenCalledWith(
        limit,
        lastItemId,
      );
      expect(result).toEqual(expect.arrayContaining([unmoderatedGiveaways, 2]));
    });

    it('should throw NotFoundException if last item id is invalid', async () => {
      const limit = 10;
      const lastItemId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getUnmoderatedGiveaways(limit, lastItemId),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: lastItemId });
    });
  });
});
