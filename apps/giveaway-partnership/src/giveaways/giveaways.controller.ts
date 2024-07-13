import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { GiveawaysService } from './giveaways.service';
import { Serialize } from '../interceptors/serialize.interceptor';
import { GiveawayDto } from './dto/giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { CurrentUser, PublicRoute } from '../decorators';
import { AdminGuard } from '../guards/jwt-admin.guard';
import { GiveawayBaseDto } from './dto/giveaway-base.dto';
import { GiveawayResultDto } from './dto/giveaway-result.dto';
import { ParticipantsSourceDto } from './dto/participants-source.dto';
import { Response } from 'express';

@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) {}

  @Post()
  @Serialize(GiveawayDto)
  createGiveaway(
    @Body() body: CreateGiveawayDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.giveawaysService.create(body, userId);
  }

  @Post('/:id/end')
  @Serialize(GiveawayDto)
  async endGiveaway(@Param('id') id: string) {
    const giveaway = await this.giveawaysService.end(id);
    return giveaway;
  }

  @Get('/search')
  @Serialize(GiveawayBaseDto)
  async searchGiveaways(@Query('query') query: string) {
    return this.giveawaysService.searchGiveaways(query);
  }

  @Get()
  @UseGuards(AdminGuard)
  @Serialize(GiveawayBaseDto)
  async getPaginatediveaways(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('lastItemId') lastItemId: string,
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
  giveawayResult(@Param('id') id: string) {
    return this.giveawaysService.getResult(id);
  }

  @Get('/:id')
  @Serialize(GiveawayDto)
  async findGiveaway(@Param('id') id: string) {
    const giveaway = await this.giveawaysService.findById(id);

    if (giveaway == null) {
      throw new NotFoundException('Giveaway not found.');
    }

    return giveaway;
  }

  // @Get('/partners/:userId')
  // @Serialize(GiveawayBaseDto)
  // async getPatnerGiveaways(
  //   @Param('userId') id: string,
  //   @Query('page') page: string,
  //   @Query('limit') limit: string,
  //   @Query('lastItemId') lastItemId: string,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   try {
  //     const pageInt = parseInt(page);
  //     const limitInt = parseInt(limit);
  //     const lastId = parseInt(lastItemId) || undefined;
  //     if (
  //       isNaN(pageInt) ||
  //       isNaN(limitInt) ||
  //       pageInt - 1 < 0 ||
  //       limitInt < 0
  //     ) {
  //       throw new BadRequestException('Query params must be positive numbers');
  //     }

  //     const [giveaways, total] =
  //       await this.giveawaysService.getPartneredPaginatedGiveaways(
  //         parseInt(id),
  //         pageInt,
  //         limitInt,
  //         lastId,
  //       );

  //     response.setHeader('giveaways-total-count', total);
  //     return giveaways;
  //   } catch (error) {
  //     throw new BadRequestException();
  //   }
  // }

  // @Get('/users/:userId')
  // @Serialize(GiveawayBaseDto)
  // async getOwnGiveaways(
  //   @Param('userId') id: string,
  //   @Query('offset', ParseIntPipe) offset: number,
  //   @Query('limit', ParseIntPipe) limit: number,
  //   @Query('lastItemId') lastItemId: string,
  //   @Query('next', ParseBoolPipe) next: boolean,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   try {
  //     const lastId = parseInt(lastItemId) || undefined;

  //     const [giveaways, total] =
  //       await this.giveawaysService.getOwnPaginatedGiveaways(
  //         id,
  //         offset,
  //         limit,
  //         next,
  //         lastId,
  //         [],
  //       );

  //     response.setHeader('giveaways-total-count', total);
  //     return giveaways;
  //   } catch (error) {
  //     throw new BadRequestException();
  //   }
  // }

  @Patch('/moderation/:id/approve')
  @UseGuards(AdminGuard)
  async approveGiveaway(@Param('id') id: string) {
    await this.giveawaysService.moderateApprove(id);
    return { message: 'Approved' };
  }

  @Delete('/moderation/:id/delete')
  @UseGuards(AdminGuard)
  async deleteGiveaway(@Param('id') _id: string) {
    await this.giveawaysService.moderateDelete(_id);
    return { message: 'Deleted' };
  }

  @Patch('/:id')
  @Serialize(GiveawayDto)
  updateGiveaway(@Param('id') _id: string, @Body() body: UpdateGiveawayDto) {
    return this.giveawaysService.update(_id, body);
  }

  @Delete('/:id')
  @Serialize(GiveawayDto)
  removeGiveaway(@Param('id') _id: string) {
    return this.giveawaysService.remove(_id);
  }

  @Post('/collect-participants')
  async collectParticipants(
    @CurrentUser('sub') userId: string,
    @Body() participantsSourceDto: ParticipantsSourceDto,
  ) {
    console.log(participantsSourceDto);
    this.giveawaysService.collectParticipants(participantsSourceDto, userId);
  }

  @Post('/add-participants/:id')
  addParticipants(
    @Param('id') _id: string,
    @Body() addParticipantsDto: AddParticipantsDto,
  ) {
    this.giveawaysService.addParticipants(_id, addParticipantsDto);
  }
}
