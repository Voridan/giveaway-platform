import { Injectable } from '@nestjs/common';
import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class PasswordService {
  private readonly KEYLEN = 32;

  constructor() {}

  async hash(password: string) {
    const salt = randomBytes(8).toString('hex');

    const hashBuffer = (await scrypt(password, salt, this.KEYLEN)) as Buffer;
    const hash = salt + '.' + hashBuffer.toString('hex');

    return hash;
  }

  async compare(password: string, loginPassword: string) {
    const [salt, storedHash] = password.split('.');
    const hash = (
      (await scrypt(loginPassword, salt, this.KEYLEN)) as Buffer
    ).toString('hex');

    return storedHash === hash;
  }
}
