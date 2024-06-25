import {
  BadRequestException,
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
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from '@app/common/database/typeorm/entities/user.entity';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { GiveawayDto } from './dto/giveaway.dto';
import { ModerateGiveawayDto } from './dto/moderate-giveaway.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { PaginationResponseDto } from './dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Serialize(GiveawayDto)
  createGiveaway(@Body() body: CreateGiveawayDto, @CurrentUser() user: User) {
    return this.giveawaysService.create(body, user);
  }

  @Patch('/moderation/:id')
  @UseGuards(AdminGuard)
  @Serialize(GiveawayDto)
  moderateGiveaway(@Param('id') id: string, @Body() body: ModerateGiveawayDto) {
    return this.giveawaysService.moderate(parseInt(id), body.onModeration);
  }

  @Get('/search')
  @UseGuards(AuthGuard)
  @Serialize(GiveawayDto)
  async searchGiveaways(@Query('query') query: string) {
    return this.giveawaysService.searchGiveaways(query);
  }

  @Get()
  @Serialize(PaginationResponseDto)
  async getPaginatediveaways(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('lastItemId') lastItemId: string,
  ) {
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const lastId = parseInt(lastItemId) || undefined;
    if (isNaN(pageInt) || isNaN(limitInt) || pageInt - 1 < 0 || limitInt < 0) {
      throw new BadRequestException('Query params must be positive numbers');
    }

    const [giveaways, total] = await this.giveawaysService.getPaginatediveaways(
      pageInt,
      limitInt,
      lastId,
    );

    const giveawaysDto = plainToInstance(GiveawayDto, giveaways, {
      excludeExtraneousValues: true,
    });

    return new PaginationResponseDto(giveawaysDto, total);
  }

  @Get('/:id/results')
  @Serialize(GiveawayDto)
  @UseGuards(AuthGuard)
  giveawayResult(@Param('id') id: string) {
    return this.giveawaysService.getResult(parseInt(id));
  }

  @Get('/:id')
  @Serialize(GiveawayDto)
  async findGiveaway(@Param('id') id: string) {
    const giveaway = await this.giveawaysService.findById(parseInt(id));
    if (giveaway == null) {
      throw new NotFoundException('Giveaway not found.');
    }

    return giveaway;
  }

  @Patch('/:id')
  @Serialize(GiveawayDto)
  @UseGuards(AuthGuard)
  updateGiveaway(@Param('id') id: string, @Body() body: UpdateGiveawayDto) {
    return this.giveawaysService.update(parseInt(id), body);
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @Serialize(GiveawayDto)
  removeGiveaway(@Param('id') id: string) {
    return this.giveawaysService.remove(parseInt(id));
  }

  @Post('/collect-participants')
  @UseGuards(AuthGuard)
  async collectParticipants(
    @CurrentUser() user: User,
    @Body() participantsSourceDto: ParticipantsSourceDto,
  ) {
    this.giveawaysService.collectParticipants(participantsSourceDto, user.id);
  }

  @Post('/add-participants/:id')
  @UseGuards(AuthGuard)
  addParticipants(
    @Param('id') id: string,
    @Body() addParticipantsDto: AddParticipantsDto,
  ) {
    this.giveawaysService.addParticipants(parseInt(id), addParticipantsDto);
  }
}
