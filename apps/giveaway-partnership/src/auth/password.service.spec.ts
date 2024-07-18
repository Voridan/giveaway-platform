import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  describe('hash', () => {
    it('should hash the password', async () => {
      const result = await service.hash('test_password');
      const [salt, hash] = result.split('.');

      expect(salt).toBeDefined();
      expect(hash).toBeDefined();
    });
  });

  describe('compare', () => {
    it('should return true if the password matches the hashed password', async () => {
      const hashedPassword = await service.hash('test_password');
      const isValid = await service.compare(hashedPassword, 'test_password');

      expect(isValid).toBe(true);
    });

    it('should return false if the password does not match the hashed password', async () => {
      const hashedPassword = await service.hash('test_password');
      const isValid = await service.compare(hashedPassword, 'wrong_password');

      expect(isValid).toBe(false);
    });
  });
});
