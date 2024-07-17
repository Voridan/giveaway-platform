import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './pasword.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: UsersService;
  let mockPasswordService: PasswordService;
  // let mockJwtService: JwtService;
  // let mockConfigService: ConfigService;
  // let mockUsersRepo: UserTypeOrmRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest
              .fn()
              .mockImplementation(() => Promise.resolve('hashedpassword')),
          },
        },
      ],
    });
  });
});
