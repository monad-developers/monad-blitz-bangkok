import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PolyUserService } from 'src/core/services/poly-user.service';
import { PolyService } from 'src/core/services/poly.service';
import { PolymarketService } from 'src/core/services/polymarket.service';

@Controller('/api/poly')
export class PolyController {
  constructor(
    private readonly polymarketService: PolymarketService,
    private readonly polyService: PolyService,
    private readonly polyUserService: PolyUserService,
  ) {}

  @Get('events')
  getEvents(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    limit = limit || 10;
    offset = offset || 0;
    return this.polyUserService.getEventsPaginate({ limit, offset });
  }

  @Get('tags')
  getTags() {
    return this.polyUserService.getTags();
  }

  @Get('event/:id')
  getEventBySlug(@Param('id') id: string) {
    return this.polyUserService.getEventBySlug(id);
  }
}
