import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDb } from './clearDb';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Giveaways E2E', () => {
  let app: INestApplication;
  let connection: Connection;

  const BASE_URL = '/giveaways';

  const testUser = {
    userName: 'testgiveaway',
    email: 'testgiveaway@example.com',
    password: 'password',
    isAdmin: false,
  };
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();
    await clearDb(connection);
  });

  describe('createGiveaway', () => {
    it('should create giveaway for the user with specified id', async () => {
      const server = app.getHttpServer();
      const signupResponse = await request(server)
        .post('/auth/local/signup')
        .send(testUser);

      if (signupResponse.ok) {
        const response = await request(server)
          .post(BASE_URL)
          .set('Authorization', `Bearer ${signupResponse.body.accessToken}`)
          .send({
            title: 'testGiveaway',
            description: 'testDescription',
            postUrl: 'https://instagram.com/p/somePost',
          })
          .expect(201);

        expect(response.body).toEqual(
          expect.objectContaining({
            title: 'testGiveaway',
            description: 'testDescription',
            postUrl: 'https://instagram.com/p/somePost',
            onModeration: true,
            ended: false,
          }),
        );
      } else {
        throw new BadRequestException(
          'Failed to signup user, when testing createGiveaway',
        );
      }
    });

    it('should update giveaway', async () => {
      const server = app.getHttpServer();
      const loginResponse = await request(server)
        .post('/auth/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      if (loginResponse.ok) {
        const createResponse = await request(server)
          .post(BASE_URL)
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
          .send({
            title: 'testGiveaway for update',
            description: 'testDescription',
            postUrl: 'https://instagram.com/p/somePost',
          })
          .expect(201);

        const updResponse = await request(server)
          .patch(BASE_URL + `/${createResponse.body.id}`)
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
          .send({
            title: 'testGiveaway1232',
            participants: 'testP1 testP2',
          })
          .expect(200);

        expect(updResponse.body.title).toEqual('testGiveaway1232');
        expect(updResponse.body.participantsCount).toEqual(2);
      } else {
        throw new BadRequestException(
          'Failed to signup user, when testing createGiveaway',
        );
      }
    });

    it('should create giveaway with participants and partners for the user with specified id', async () => {
      const server = app.getHttpServer();
      const partnersSignup = await Promise.all([
        request(server).post('/auth/local/signup').send({
          userName: 'partner1',
          email: 'partner1@example.com',
          password: 'password',
          isAdmin: false,
        }),
        request(server).post('/auth/local/signup').send({
          userName: 'partner2',
          email: 'partner2@example.com',
          password: 'password',
          isAdmin: false,
        }),
      ]);

      if (partnersSignup.some((res) => !res.ok)) {
        throw new BadRequestException('Failed to signup partners');
      }
      const partnersIds = partnersSignup.map((res) => res.body.id).join(' ');

      const loginResponse = await request(server)
        .post('/auth/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      if (loginResponse.ok) {
        const response = await request(server)
          .post(BASE_URL)
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
          .send({
            title: 'testGiveaway',
            description: 'testDescription',
            postUrl: 'https://instagram.com/p/somePost',
            participants: 'sara john luke',
            partnersIds,
          })
          .expect(201);

        expect(response.body.participantsCount).toEqual(3);
        expect(response.body.partners).toBeDefined();
      } else {
        throw new BadRequestException(
          'Failed to login user, when testing createGiveaway',
        );
      }
    });
  });

  describe('updateGiveaway', () => {
    it('should update giveaway', async () => {
      const server = app.getHttpServer();
      const loginResponse = await request(server)
        .post('/auth/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      if (loginResponse.ok) {
        const createResponse = await request(server)
          .post(BASE_URL)
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
          .send({
            title: 'testGiveaway for update',
            description: 'testDescription',
            postUrl: 'https://instagram.com/p/somePost',
          })
          .expect(201);

        const updResponse = await request(server)
          .patch(BASE_URL + `/${createResponse.body.id}`)
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
          .send({
            title: 'testGiveaway1232',
            participants: 'testP1 testP2',
          })
          .expect(200);

        expect(updResponse.body.title).toEqual('testGiveaway1232');
        expect(updResponse.body.participantsCount).toEqual(2);
      } else {
        throw new BadRequestException(
          'Failed to signup user, when testing createGiveaway',
        );
      }
    });
  });

  describe('endGiveaway', () => {
    it('should end giveaway with specified id', async () => {
      const server = app.getHttpServer();
      const loginResponse = await request(server)
        .post('/auth/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      const createResponse = await request(server)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          title: 'giveawayToEnd',
          description: 'testDescription',
          postUrl: 'https://instagram.com/p/somePost',
          participants: 'sara john luke',
        });

      const endResponse = await request(server)
        .patch(BASE_URL + `/${createResponse.body.id}/end`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(endResponse.body.ended).toEqual(true);
    });
  });

  describe('giveawayResult', () => {
    it('should return giveaway results', async () => {
      const server = app.getHttpServer();
      const loginResponse = await request(server)
        .post('/auth/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      const createResponse = await request(server)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          title: 'giveawaywithResult',
          description: 'testDescription',
          postUrl: 'https://instagram.com/p/somePost',
          participants: 'sara john luke',
        });

      const resultsResponse = await request(server)
        .get(BASE_URL + `/${createResponse.body.id}/results`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(resultsResponse.body.participants).toEqual(
        expect.arrayContaining(['sara', 'john', 'luke']),
      );
      expect(resultsResponse.body.winner).toEqual('');
    });
  });

  describe('removeGiveaway', () => {
    it('should delete giveaway with its participants', async () => {
      const server = app.getHttpServer();
      const loginResponse = await request(server)
        .post('/auth/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      const createResponse = await request(server)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          title: 'giveawayToDelete',
          description: 'testDescription',
          postUrl: 'https://instagram.com/p/somePost',
          participants: 'sara john luke',
        });

      await request(server)
        .delete(BASE_URL + `/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);
    });
  });
});
