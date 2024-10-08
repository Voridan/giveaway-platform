import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GiveawaysService } from './giveaways.service';
import { Serialize } from '../interceptors/serialize.interceptor';
import { GiveawayDto } from './dto/giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { CurrentUser } from '../decorators';
import { AdminGuard } from '../guards/jwt-admin.guard';
import { Response } from 'express';
import { GiveawayBaseDto } from './dto/giveaway-base.dto';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { StatsParticipantsDto } from './dto/stats-participants.dto';

@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) {}

  @Post()
  @Serialize(GiveawayDto)
  async createGiveaway(
    @Body() body: CreateGiveawayDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.giveawaysService.create(body, userId);
  }

  @Patch('/:id/end')
  @Serialize(GiveawayDto)
  endGiveaway(@Param('id', ParseIntPipe) id: number) {
    return this.giveawaysService.end(id);
  }

  @Get('/search')
  @Serialize(GiveawayBaseDto)
  async searchGiveaways(@Query('query') query: string) {
    return this.giveawaysService.searchGiveaways(query);
  }

  @Get()
  @UseGuards(AdminGuard)
  @Serialize(GiveawayBaseDto)
  async getGiveawaysForModeration(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('lastItemId', ParseIntPipe) lastItemId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const [giveaways, total] =
        await this.giveawaysService.getUnmoderatedGiveaways(limit, lastItemId);

      response.setHeader('giveaways-total-count', total);
      return giveaways;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get('/:id/results')
  @Serialize(GiveawayResultDto)
  giveawayResult(@Param('id', ParseIntPipe) id: number) {
    return this.giveawaysService.getResult(id);
  }

  @Get('/:id')
  @Serialize(GiveawayDto)
  async findGiveaway(@Param('id', ParseIntPipe) id: number) {
    const giveaway = await this.giveawaysService.findById(id);

    if (giveaway == null) {
      throw new NotFoundException('Giveaway not found.');
    }

    return giveaway;
  }

  @Get('/partners/:userId')
  @Serialize(GiveawayBaseDto)
  async getPatnerGiveaways(
    @Param('userId', ParseIntPipe) id: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('lastItemId', new ParseIntPipe({ optional: true }))
    lastItemId: number,
    @Query('forward', new ParseBoolPipe({ optional: true }))
    forward: boolean = true,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const [giveaways, total] =
        await this.giveawaysService.getPartneredPaginatedGiveaways(
          id,
          offset,
          limit,
          lastItemId,
          forward,
        );

      response.setHeader('giveaways-total-count', total);
      return giveaways;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get('/users/:userId')
  @Serialize(GiveawayBaseDto)
  async getOwnGiveaways(
    @Param('userId', ParseIntPipe) id: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('lastItemId', new ParseIntPipe({ optional: true }))
    lastItemId: number,
    @Query('forward', new ParseBoolPipe({ optional: true }))
    forward: boolean = true,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const [giveaways, total] =
        await this.giveawaysService.getOwnPaginatedGiveaways(
          id,
          offset,
          limit,
          lastItemId,
          forward,
        );

      response.setHeader('giveaways-total-count', total);
      return giveaways;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get('/stats-participants/users/:id')
  @Serialize(StatsParticipantsDto)
  async getParticipantsStats(@Param('id', ParseIntPipe) ownerId: number) {
    return this.giveawaysService.getParticipantsStats(ownerId);
  }

  @Patch('/moderation/:id/approve')
  @UseGuards(AdminGuard)
  async approveGiveaway(@Param('id', ParseIntPipe) id: number) {
    await this.giveawaysService.moderateApprove(id);
    return { message: 'Approved' };
  }

  @Delete('/moderation/:id/delete')
  @UseGuards(AdminGuard)
  async deleteGiveaway(@Param('id', ParseIntPipe) id: number) {
    await this.giveawaysService.moderateDelete(id);
    return { message: 'Deleted' };
  }

  @Patch('/:id')
  @Serialize(GiveawayDto)
  updateGiveaway(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateGiveawayDto,
  ) {
    return this.giveawaysService.update(id, body);
  }

  @Delete('/:id')
  @Serialize(GiveawayDto)
  removeGiveaway(@Param('id', ParseIntPipe) id: number) {
    return this.giveawaysService.remove(id);
  }

  @Post('/collect-participants')
  async collectParticipants(
    @CurrentUser('sub') userId: number,
    @Body() participantsSourceDto: ParticipantsSourceDto,
  ) {
    this.giveawaysService.collectParticipants(participantsSourceDto, userId);
  }

  @Post('/add-participants/:id')
  addParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() addParticipantsDto: AddParticipantsDto,
  ) {
    this.giveawaysService.addParticipants(id, addParticipantsDto);
  }
}
