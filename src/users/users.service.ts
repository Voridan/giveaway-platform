import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  create(newUser: CreateUserDto) {
    const user = this.repo.create(newUser);

    return this.repo.save(user);
  }

  findById(userId: number) {
    return this.repo.findOne({ where: { userId } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findAll() {
    //! to make pagination (on last item id)
    return this.repo.find();
  }

  async update(id: number, attrs: Partial<User>) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    Object.assign(user, attrs);
    return this.repo.save(user);
  }

  async remove(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.repo.remove(user);
  }
}
