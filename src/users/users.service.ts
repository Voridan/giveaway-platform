import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UserMongooseRepository } from 'src/repository/user.mongoose-repository';
import { UserDocument } from '@app/common';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UserMongooseRepository) {}

  create(newUser: CreateUserDto) {
    return this.repo.create(newUser);
  }

  //! findById(id: number) {
  //   try {
  //     return this.repo.findOne({ id }, { ownGiveaways: true });
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // }

  //! findManyById(ids: number[]) {
  //   try {
  //     return this.repo.find({ id: In(ids) });
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // }

  findByEmail(email: string) {
    return this.repo.findOne({ email });
  }

  //! findSimilar(like: string) {
  //   return this.repo.findSimilar(like);
  // }

  findAll() {
    return this.repo.find({});
  }

  async update(id: number, attrs: Partial<UserDocument>) {
    return this.repo.findOneAndUpdate({ id }, attrs);
  }

  async remove(id: number) {
    return this.repo.findOneAndDelete({ id });
  }
}
