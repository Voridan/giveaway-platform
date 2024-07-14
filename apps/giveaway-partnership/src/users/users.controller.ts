import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../decorators';

@Controller('users')
@Serialize(UserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  // @Query('limit') limit: number, @Query('offset') offset: number
  findAllUsers() {
    // console.log(`limit: ${limit}, offset: ${offset}`);
    return this.usersService.findAll();
  }

  @Get('/search')
  async findSimilar(
    @CurrentUser('sub') userId: number,
    @Query('like') like: string,
  ) {
    const users = await this.usersService.findSimilar(like);
    return users.filter((user) => user.id !== userId);
  }

  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findById(parseInt(id));
    console.log(user);

    if (user == null) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(parseInt(id), body);
  }

  @Delete('/:id')
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(parseInt(id));
  }
}
