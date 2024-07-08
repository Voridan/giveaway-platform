import { Injectable } from '@nestjs/common';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserTypeOrmRepository } from 'src/repository/typeorm/user.typeorm-repository';
import { In } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UserTypeOrmRepository) {}

  create(newUser: CreateUserDto) {
    const user = new User(newUser);
    return this.repo.create(user);
  }

  findById(id: number) {
    try {
      return this.repo.findOne({ id }, { ownGiveaways: true });
    } catch (error) {
      throw new Error(error);
    }
  }

  findManyById(ids: number[]) {
    try {
      return this.repo.find({ id: In(ids) });
    } catch (error) {
      throw new Error(error);
    }
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

  async update(id: number, attrs: Partial<User>) {
    return this.repo.findOneAndUpdate({ id }, attrs);
  }

  async remove(id: number) {
    return this.repo.findOneAndDelete({ id });
  }
}
