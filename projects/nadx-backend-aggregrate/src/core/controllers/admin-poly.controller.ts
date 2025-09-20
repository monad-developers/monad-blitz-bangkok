import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InitPolyCrerateDto } from 'src/core/dtos/poly.dto';
import { AdminGuard } from 'src/core/guards/admin.guard';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { PolyService } from 'src/core/services/poly.service';
import { PolymarketService } from 'src/core/services/polymarket.service';

@UseGuards(AuthGuard, AdminGuard)
@Controller('/api/admin/poly')
export class AdminPolyController {
  constructor(
    private readonly polymarketService: PolymarketService,
    private readonly polyService: PolyService,
  ) {}

  @Post('init-by-volume')
  create(@Body() createPolyDto: InitPolyCrerateDto) {
    return this.polyService.initByVolume(createPolyDto);
  }
}
