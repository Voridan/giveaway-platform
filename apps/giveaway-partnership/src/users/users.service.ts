import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '@app/common';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  create(newUser: CreateUserDto) {
    return this.prismaService.user.create({ data: newUser });
  }

  findById(id: number) {
    try {
      return this.prismaService.user.findUnique({ where: { id } });
    } catch (error) {
      throw new Error(error);
    }
  }

  findManyById(ids: number[]) {
    return this.prismaService.user.findMany({ where: { id: { in: ids } } });
  }

  findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  findSimilar(like: string) {
    return this.prismaService.$queryRaw`SELECT * FROM find_users(${like})`;
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  async update(id: number, updateData: Partial<UserDto>) {
    return this.prismaService.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.prismaService.user.delete({ where: { id } });
  }
}
