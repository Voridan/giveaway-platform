import {
  Controller,
  Delete,
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
    @CurrentUser('sub') userId: string,
    @Query('like') like: string,
  ) {
    const users = await this.usersService.findSimilar(like);
    return users.filter((user) => user._id.toString() !== userId);
  }

  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user == null) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  @Delete('/:id')
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
