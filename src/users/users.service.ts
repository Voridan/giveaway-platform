import { Injectable } from '@nestjs/common';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserTypeOrmRepository } from 'src/repository/user.typeorm-repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UserTypeOrmRepository) {}

  create(newUser: CreateUserDto) {
    const user = new User(newUser);
    return this.repo.create(user);
  }

  findById(id: number) {
    return this.repo.findOne({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ email });
  }

  findAll() {
    //! to make pagination (on last item id)
    return this.repo.find({});
  }

  async update(id: number, attrs: Partial<User>) {
    return this.repo.findOneAndUpdate({ id }, attrs);
  }

  async remove(id: number) {
    return this.repo.findOneAndDelete({ id });
  }
}
