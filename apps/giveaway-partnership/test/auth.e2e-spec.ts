import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { LoginUserDto } from '../src/users/dto/login-user.dto';
import { AuthService } from '../src/auth/auth.service';
import { MailService } from '../src/mail/mail.service';
import { clearDb } from './clearDb';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Authentication E2E', () => {
  let app: INestApplication;
  let connection: Connection;
  let authService: AuthService;
  let mailService: MailService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get(AuthService);
    mailService = moduleFixture.get(MailService);
    connection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();
    await clearDb(connection);
  });

  describe('signupLocal', () => {
    it('should signup a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'test',
        email: 'test@example.com',
        password: 'password',
        isAdmin: false,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/signup')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        userName: createUserDto.userName,
        email: createUserDto.email,
        isAdmin: createUserDto.isAdmin,
        accessToken: expect.any(String),
      });
    });

    it('should throw BadRequestException if username or email is not unique', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'test',
        email: 'test@example.com',
        password: 'password',
        isAdmin: false,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/signup')
        .send(createUserDto)
        .expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: expect.any(String),
        error: 'Bad Request',
      });
    });

    it('should signup a user as admin with correct admin secret', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'admin',
        email: 'admin@example.com',
        password: 'password',
        isAdmin: true,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/signup')
        .query({ admin: 'admin_secret_key' })
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        userName: createUserDto.userName,
        email: createUserDto.email,
        isAdmin: createUserDto.isAdmin,
        accessToken: expect.any(String),
      });
    });

    it('should throw an error with wrong admin secret', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'admin',
        email: 'admin@example.com',
        password: 'password',
        isAdmin: true,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/signup')
        .query({ admin: 'wrong_secret_key' })
        .send(createUserDto)
        .expect(400);

      expect(response.body.message).toBe('Wrong secret');
    });
  });

  describe('loginLocal', () => {
    it('should login a user successfully', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const expectedRes = {
        email: 'test@example.com',
        userName: 'test',
        isAdmin: false,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/login')
        .send(loginUserDto)
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        userName: expectedRes.userName,
        email: expectedRes.email,
        isAdmin: expectedRes.isAdmin,
        accessToken: expect.any(String),
      });
    });

    it('should throw BadRequestException if email is invalid', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'invalid@example.com',
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/login')
        .send(loginUserDto)
        .expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Invalid email.',
        error: 'Bad Request',
      });
    });

    it('should throw BadRequestException if password is invalid', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/local/login')
        .send(loginUserDto)
        .expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Wrong password.',
        error: 'Bad Request',
      });
    });
  });

  describe('logout', () => {
    it('should logout a user successfully', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/local/login')
        .send(loginUserDto)
        .expect(200);

      const logoutResponse = await request(app.getHttpServer())
        .get('/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      const str = logoutResponse.headers['set-cookie'][0];
      const token = str.match(/(?<=jwt=)[\w-]+\.[\w-]+\.[\w-]+(?=;)/g);
      expect(token).toBeNull();
    });

    it('should return 401 if user is not authenticated', async () => {
      await request(app.getHttpServer()).get('/auth/logout').expect(401);
    });
  });

  describe('forgot-password', () => {
    it('should send a password reset email', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password',
      };

      jest.spyOn(authService, 'generateResetPasswordTokenAndSave');
      jest.spyOn(mailService, 'sendEmail');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/local/login')
        .send(loginUserDto)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(
        authService.generateResetPasswordTokenAndSave,
      ).toHaveBeenCalledWith(loginUserDto.email);
      expect(mailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: loginUserDto.email,
          subject: 'Password reset',
          html: expect.any(String),
        }),
      );
    });
  });
});
