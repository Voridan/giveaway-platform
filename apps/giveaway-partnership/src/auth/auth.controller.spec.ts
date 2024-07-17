import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@app/common';
import { Tokens } from './types';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
// import { MailService } from '../mail/mail.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Pick<
    jest.MockedObject<AuthService>,
    'signupLocal' | 'loginLocal'
  >;
  let mockUsersService: Pick<jest.MockedObject<UsersService>, 'findByEmail'>;
  let mockConfigService: Pick<jest.MockedObject<ConfigService>, 'get'>;
  let mockMailService: Pick<jest.MockedObject<MailService>, 'sendEmail'>;
  let response: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signupLocal: jest.fn(),
            loginLocal: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('admin-secret'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn().mockReturnValue('<h1>Hello World!</h1>'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    mockAuthService = module.get(AuthService);
    mockConfigService = module.get(ConfigService);
    mockUsersService = module.get(UsersService);
    response = {
      cookie: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signupLocal', () => {
    it('should sign up user as admin with a valid admin secret', async () => {
      const dto: CreateUserDto = {
        email: 'test@test.com',
        userName: 'test',
        password: 'qwerty',
        isAdmin: true,
      };
      const expectedResult = {
        user: {
          id: 1,
          email: 'test@test.com',
          userName: 'test',
          isAdmin: true,
        } as User,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        } as Tokens,
      };
      mockAuthService.signupLocal.mockResolvedValue(expectedResult);

      const res = await controller.signupLocal(
        'admin-secret',
        dto,
        response as Response,
      );

      expect(mockAuthService.signupLocal).toHaveBeenCalledWith(dto);
      expect(response.cookie).toHaveBeenCalledWith(
        'jwt',
        expectedResult.tokens.refreshToken,
        expect.any(Object),
      );
      expect(res).toEqual({
        user: expectedResult.user,
        accessToken: expectedResult.tokens.accessToken,
      });
    });

    it('should throw BadRequestException for invalid admin secret', async () => {
      const dto: CreateUserDto = {
        email: 'test@test.com',
        userName: 'test',
        password: 'qwerty',
        isAdmin: true,
      };
      await expect(
        controller.signupLocal('wrong-secret', dto, response as Response),
      ).rejects.toThrow(new BadRequestException('Wrong secret'));
    });

    it('should sign up user as a regular user', async () => {
      const dto: CreateUserDto = {
        email: 'test@test.com',
        userName: 'test',
        password: 'qwerty',
        isAdmin: false,
      };
      const expectedResult: { user: User; tokens: Tokens } = {
        user: {
          id: 1,
          email: 'test@test.com',
          userName: 'test',
          isAdmin: false,
        } as User,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        } as Tokens,
      };

      mockAuthService.signupLocal.mockResolvedValue(expectedResult);
      const res = await controller.signupLocal('', dto, response as Response);
      console.log('res', res);

      expect(mockAuthService.signupLocal).toHaveBeenCalledWith(dto);
      expect(response.cookie).toHaveBeenCalledWith(
        'jwt',
        expectedResult.tokens.refreshToken,
        expect.any(Object),
      );
      expect(res).toEqual({
        user: expectedResult.user,
        accessToken: expectedResult.tokens.accessToken,
      });
    });

    it('should throw if email is taken', async () => {
      const takenEmail = 'test@test.com';

      const dto: CreateUserDto = {
        email: takenEmail,
        userName: 'test',
        password: 'qwerty',
        isAdmin: false,
      };

      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 12,
        email: takenEmail,
        userName: 'test',
        password: 'hashedpassword',
        isAdmin: false,
      } as User);

      mockAuthService.signupLocal.mockImplementation(
        async (dto: CreateUserDto) => {
          const user = await mockUsersService.findByEmail(dto.email);
          if (user !== null) {
            throw new BadRequestException('Email is taken.');
          }
          return {
            user,
            tokens: {
              accessToken: 'accessToken',
              refreshToken: 'refreshToken',
            },
          };
        },
      );

      expect(
        controller.signupLocal('', dto, response as Response),
      ).rejects.toThrow(BadRequestException);
      expect(
        controller.signupLocal('', dto, response as Response),
      ).rejects.toThrow('Email is taken');
      expect(mockAuthService.signupLocal).toHaveBeenCalledWith(dto);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('loginLocal', () => {
    it('should log user in', async () => {
      const dto: LoginUserDto = {
        email: 'test@test.com',
        password: 'qwerty',
      };
      const expectedResult = {
        user: {
          id: 1,
          email: 'test@test.com',
          userName: 'test',
          isAdmin: false,
        } as User,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        } as Tokens,
      };

      mockAuthService.loginLocal.mockResolvedValue(expectedResult);
      const res = await controller.loginLocal(dto, response as Response);

      expect(mockAuthService.loginLocal).toHaveBeenCalledWith(dto);
      expect(response.cookie).toHaveBeenCalledWith(
        'jwt',
        expectedResult.tokens.refreshToken,
        expect.any(Object),
      );
      expect(res).toEqual({
        ...expectedResult.user,
        accessToken: expectedResult.tokens.accessToken,
      });
    });
  });
});
