import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from 'src/core/controllers/auth.controller';
import { PolyController } from 'src/core/controllers/poly.controller';
import { UserController } from 'src/core/controllers/user.controller';
import { AuthService } from 'src/core/services/auth.service';
import { PolyService } from 'src/core/services/poly.service';
import { PolymarketService } from 'src/core/services/polymarket.service';
import { ConfigurationModule } from 'src/database/config/configuration.module';
import { UsersModule } from 'src/database/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Market, MarketSchema } from 'src/database/polymarket/market.schema';
import { Event, EventSchema } from 'src/database/polymarket/event.schema';
import { Tag, TagSchema } from 'src/database/polymarket/tag.schema';
import { AdminPolyController } from 'src/core/controllers/admin-poly.controller';
import { PolyUserService } from 'src/core/services/poly-user.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const JWT_SECRET = configService.get('JWT_SECRET') as string;
        if (!JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined');
        }
        return {
          secret: JWT_SECRET,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // milliseconds
          ttl: 60 * 60 * 1000, // 1 hr
          limit: 20,
        },
      ],
    }),
    UsersModule,
    ConfigurationModule,
    MongooseModule.forFeature([
      { name: Market.name, schema: MarketSchema },
      { name: Event.name, schema: EventSchema },
      { name: Tag.name, schema: TagSchema },
    ]),
  ],
  controllers: [
    UserController,
    AuthController,
    PolyController,
    AdminPolyController,
  ],
  providers: [AuthService, PolymarketService, PolyService, PolyUserService],
})
export class CoreModule {}
