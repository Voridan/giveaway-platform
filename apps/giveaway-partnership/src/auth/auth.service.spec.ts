import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@app/common';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Pick<
    jest.MockedObject<UsersService>,
    'findByEmail' | 'create' | 'update' | 'findById'
  >;
  let mockPasswordService: Pick<
    jest.MockedObject<PasswordService>,
    'hash' | 'compare'
  >;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();
    authService = module.get(AuthService);
    mockUsersService = module.get(UsersService);
    mockPasswordService = module.get(PasswordService);
  });

  describe('signupLocal', () => {
    it('should throw if email is taken ', async () => {
      const dto: CreateUserDto = {
        email: 'test@test.com',
        userName: 'test',
        password: 'qwerty',
        isAdmin: false,
      };

      mockUsersService.findByEmail.mockResolvedValue({
        id: 111,
        email: 'test@test.com',
      } as User);

      expect(authService.signupLocal(dto)).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should signup user successfuly with hashed password and return user with tokens', async () => {
      const dto: CreateUserDto = {
        email: 'test@test.com',
        userName: 'test',
        password: 'qwerty',
        isAdmin: false,
      };
      const expectedRes = {
        id: 14,
        email: 'test@test.com',
        userName: 'test',
        password: 'hashedpassword',
        isAdmin: false,
      } as User;

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(expectedRes);

      jest.spyOn(authService, 'getTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      jest
        .spyOn(authService, 'updateRefreshTokenHash')
        .mockImplementation(async (userId, refreshToken) => {
          const hashedRefreshToken =
            await mockPasswordService.hash(refreshToken);
          await mockUsersService.update(
            { id: userId },
            { jwtRefreshTokenHash: hashedRefreshToken },
          );
        });

      const res = await authService.signupLocal(dto);

      expect(mockPasswordService.hash).toHaveBeenCalledTimes(2);
      expect(mockPasswordService.hash).toHaveBeenCalled();
      expect(mockPasswordService.hash).toHaveBeenCalled();
      expect(res.user).toEqual(
        expect.objectContaining({
          ...expectedRes,
        }),
      );
      expect(authService.updateRefreshTokenHash).toHaveBeenCalledWith(
        res.user.id,
        res.tokens.refreshToken,
      );
      expect(res.tokens).toBeDefined();
    });
  });

  describe('loginLocal', () => {
    it('should throw if user with specified email was not found', () => {
      const dto: LoginUserDto = {
        email: 'test@test.com',
        password: 'qwerty',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      expect(authService.loginLocal(dto)).rejects.toThrow('Invalid email.');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
    });

    it('should throw if user entered wrong password', () => {
      const dto: LoginUserDto = {
        email: 'test@test.com',
        password: 'qwerty',
      };

      mockUsersService.findByEmail.mockResolvedValue({
        id: 14,
        email: 'test@test.com',
        userName: 'test',
        password: 'hashedpassword',
      } as User);
      mockPasswordService.compare.mockResolvedValue(false);

      expect(authService.loginLocal(dto)).rejects.toThrow('Wrong password.');
    });

    it('should log user in and update tokens', async () => {
      const dto: LoginUserDto = {
        email: 'test@test.com',
        password: 'qwerty',
      };
      const expectedRes = {
        id: 14,
        email: 'test@test.com',
        userName: 'test',
        password: 'hashedpassword',
      } as User;

      mockUsersService.findByEmail.mockResolvedValue({
        id: 14,
        email: 'test@test.com',
        userName: 'test',
        password: 'hashedpassword',
      } as User);
      mockPasswordService.compare.mockResolvedValue(true);
      jest.spyOn(authService, 'getTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      jest.spyOn(authService, 'updateRefreshTokenHash');

      const res = await authService.loginLocal(dto);

      expect(res.user).toEqual(expect.objectContaining(expectedRes));
      expect(res.tokens).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      expect(authService.updateRefreshTokenHash).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should throw ForbiddenException if user does not have refresh token hash in DB', () => {
      mockUsersService.findById.mockResolvedValue({
        id: 12,
        email: 'trest@test.com',
        jwtRefreshTokenHash: null,
      } as User);

      expect(authService.refresh(12, 'refreshToken')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException if refresh tokens from DB and payload don't match", () => {
      mockUsersService.findById.mockResolvedValue({
        id: 12,
        email: 'trest@test.com',
        jwtRefreshTokenHash: 'refreshtoken',
      } as User);

      mockPasswordService.compare.mockResolvedValue(false);

      expect(authService.refresh(12, 'refreshToken')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return user with refreshed tokens', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 12,
        email: 'trest@test.com',
        jwtRefreshTokenHash: 'refreshToken',
      } as User);

      mockPasswordService.compare.mockResolvedValue(true);
      jest.spyOn(authService, 'getTokens').mockResolvedValue({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      jest.spyOn(authService, 'updateRefreshTokenHash');

      const res = await authService.refresh(12, 'refreshToken');

      expect(res.tokens).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      expect(authService.updateRefreshTokenHash).toHaveBeenCalled();
    });
  });

  describe('generateResetPasswordTokenAndSave', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.generateResetPasswordTokenAndSave('test@test.com'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
    });

    it('should return existing valid reset token', async () => {
      const existingToken = 'existingToken';
      const user = {
        id: 1,
        email: 'test@test.com',
        resetPasswordToken: existingToken,
        resetPasswordExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in the future
      } as User;

      mockUsersService.findByEmail.mockResolvedValue(user);

      const result =
        await authService.generateResetPasswordTokenAndSave('test@test.com');
      expect(result).toBe(existingToken);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should generate new secret if no valid reset token exists', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      } as User;

      const secret = 'newSecret';
      const hashedSecret = 'hashedSecret';

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockPasswordService.hash.mockResolvedValue(hashedSecret);

      jest
        .spyOn(authService, 'generateResetPasswordTokenAndSave')
        .mockImplementation(async (email: string) => {
          const user = await mockUsersService.findByEmail(email);
          if (!user) {
            throw new BadRequestException(
              'User with that email does not exists',
            );
          }

          if (
            user.resetPasswordToken &&
            new Date(user.resetPasswordExpires) > new Date()
          ) {
            return user.resetPasswordToken;
          }
          const secretHash = await mockPasswordService.hash(secret);
          user.resetPasswordToken = secretHash;
          const FIVE_MINS = 5 * 60 * 1000;
          user.resetPasswordExpires = new Date(Date.now() + FIVE_MINS);
          await mockUsersService.update({ id: user.id }, user);

          return secret;
        });

      const result =
        await authService.generateResetPasswordTokenAndSave('test@test.com');

      expect(result).toBe(secret);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith(secret);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        { id: user.id },
        {
          ...user,
          resetPasswordToken: hashedSecret,
          resetPasswordExpires: expect.any(Date),
        },
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      expect(
        authService.resetPassword(1, {
          newPassword: '',
          oldPassword: '',
          secret: '',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findById).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if reset token is expired', async () => {
      const user = {
        id: 1,
        resetPasswordExpires: new Date(Date.now() - 1000), // expired
      } as User;
      mockUsersService.findById.mockResolvedValue(user);

      expect(
        authService.resetPassword(1, {
          newPassword: '',
          oldPassword: '',
          secret: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if secret token is invalid', async () => {
      const user = {
        id: 1,
        resetPasswordExpires: new Date(Date.now() + 1000),
        resetPasswordToken: 'hashed_secret',
      } as User;
      mockUsersService.findById.mockResolvedValue(user);
      mockPasswordService.compare.mockImplementation((stored, provided) => {
        return Promise.resolve(stored === `hashed_${provided}`);
      });

      expect(
        authService.resetPassword(1, {
          newPassword: '',
          oldPassword: '',
          secret: 'invalid_secret',
        }),
      ).rejects.toThrow('Secret token is invalid');
    });

    it('should throw BadRequestException if old password is incorrect', async () => {
      const user = {
        id: 1,
        resetPasswordExpires: new Date(Date.now() + 1000),
        resetPasswordToken: 'hashed_secret',
        password: 'hashed_old_password',
      } as User;
      const dto: ResetPasswordDto = {
        newPassword: 'new_password',
        oldPassword: 'wrong_password',
        secret: 'secret',
      };

      mockUsersService.findById.mockResolvedValue(user);
      mockPasswordService.compare.mockImplementation((stored, provided) => {
        return Promise.resolve(stored === `hashed_${provided}`);
      });

      await expect(authService.resetPassword(1, dto)).rejects.toThrow(
        'Wrong old password',
      );
      expect(mockPasswordService.compare).toHaveBeenCalledTimes(2);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        user.resetPasswordToken,
        dto.secret,
      );
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        user.password,
        dto.oldPassword,
      );
    });

    it('should reset password and update tokens successfuly', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        resetPasswordExpires: new Date(Date.now() + 1000),
        resetPasswordToken: 'hashed_secret',
        password: 'old_password_hash',
        isAdmin: false,
      } as User;
      const dto = {
        newPassword: 'new_password',
        oldPassword: 'old_password',
        secret: 'secret',
      };

      mockUsersService.findById.mockResolvedValue(user);
      mockPasswordService.compare.mockImplementation((stored, provided) => {
        if (stored === 'hashed_secret' && provided === 'secret')
          return Promise.resolve(true);
        if (stored === 'old_password_hash' && provided === 'old_password')
          return Promise.resolve(true);
        return Promise.resolve(false);
      });
      mockPasswordService.hash.mockResolvedValue('new_password_hash');
      jest.spyOn(authService, 'getTokens').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      jest
        .spyOn(authService, 'updateRefreshTokenHash')
        .mockResolvedValue(undefined);
      mockUsersService.update.mockResolvedValue(user);

      const result = await authService.resetPassword(1, dto);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        { id: 1 },
        {
          ...user,
          password: 'new_password_hash',
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      );
      expect(result).toEqual(
        expect.objectContaining({
          password: 'new_password_hash',
          resetPasswordToken: null,
          resetPasswordExpires: null,
        }),
      );
      expect(authService.getTokens).toHaveBeenCalledWith(
        user.id,
        user.isAdmin,
        user.email,
      );
      expect(authService.updateRefreshTokenHash).toHaveBeenCalledWith(
        user.id,
        'refreshToken',
      );
    });
  });
});
