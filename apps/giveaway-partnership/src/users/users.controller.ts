import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { CurrentUser } from '../decorators';

@Controller('users')
@Serialize(UserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/search')
  async findSimilar(
    @CurrentUser('sub') userId: number,
    @Query('like') like: string,
  ) {
    const users = (await this.usersService.findSimilar(like)) as {
      id: number;
    }[];
    return users.filter((user) => user.id !== userId);
  }

  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findById(parseInt(id));
    if (user == null) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
