import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { GiveawaysService } from './giveaways.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/entities/user.entity';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { GiveawayDto } from './dto/giveaway.dto';
import { ModerateGiveawayDto } from './dto/moderate-giveaway.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';

@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Serialize(GiveawayDto)
  createGiveaway(@Body() body: CreateGiveawayDto, @CurrentUser() user: User) {
    return this.giveawaysService.create(body, user);
  }

  @Patch('/:id')
  @UseGuards(AdminGuard)
  moderateGiveaway(@Param('id') id: string, @Body() body: ModerateGiveawayDto) {
    return this.giveawaysService.moderate(parseInt(id), body.onModeration);
  }

  @Get('/:id/results')
  giveawayResult(@Param('id') id: string) {
    return this.giveawaysService.getResult(parseInt(id));
  }

  @Get('/:id')
  async findGiveaway(@Param('id') id: string) {
    const giveaway = await this.giveawaysService.findById(parseInt(id));
    if (giveaway == null) {
      throw new NotFoundException('User not found.');
    }

    return giveaway;
  }

  @Get()
  findAllGiveaways(
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    console.log(`limit: ${limit}, offset: ${offset}`);
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateGiveawayDto) {
    return this.giveawaysService.update(parseInt(id), body);
  }

  @Delete('/:id')
  removeUser(@Param('id') id: string) {
    return this.giveawaysService.remove(parseInt(id));
  }
}
