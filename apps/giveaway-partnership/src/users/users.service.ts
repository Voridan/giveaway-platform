import { Injectable } from '@nestjs/common';
import { User } from '@app/common/database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserTypeOrmRepository } from '../repository/user.typeorm-repository';
import { FindOptionsWhere, In } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UserTypeOrmRepository) {}

  create(newUser: CreateUserDto) {
    const user = new User(newUser);
    return this.repo.create(user);
  }

  findById(id: number) {
    try {
      return this.repo.findOne({ id });
    } catch (error) {
      throw new Error(error);
    }
  }

  findManyById(ids: number[]) {
    return this.repo.find({ id: In(ids) });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ email });
  }

  findSimilar(like: string) {
    return this.repo.findSimilar(like);
  }

  findAll() {
    return this.repo.find({});
  }

  async update(where: FindOptionsWhere<User>, attrs: Partial<User>) {
    return this.repo.findOneAndUpdate(where, attrs);
  }

  async remove(id: number) {
    return this.repo.findOneAndDelete({ id });
  }
}
