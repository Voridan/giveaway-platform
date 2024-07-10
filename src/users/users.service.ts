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

  findById(_id: string) {
    try {
      return this.repo.findOne({ _id });
    } catch (error) {
      throw new Error(error);
    }
  }

  findManyById(ids: string[]) {
    try {
      return this.repo.find({ _id: { $in: ids } });
    } catch (error) {
      throw new Error(error);
    }
  }

  findByEmail(email: string) {
    return this.repo.findOne({ email });
  }

  findSimilar(like: string) {
    return this.repo.find({
      $or: [
        { userName: { $regex: like, $options: 'i' } },
        { email: { $regex: like, $options: 'i' } },
      ],
    });
  }

  async update(_id: string, attrs: Partial<UserDocument>) {
    return this.repo.findOneAndUpdate({ _id }, attrs);
  }

  async remove(_id: string) {
    return this.repo.findOneAndDelete({ _id });
  }
}
