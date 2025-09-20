/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InitPolyCrerateDto } from 'src/core/dtos/poly.dto';
import { PolymarketService } from 'src/core/services/polymarket.service';
import {
  MarketResponseItem,
  PolymarketEvent,
  PolymarketEventResponseData,
} from 'src/core/types/polymarket.types';
import { Event, EventDocument } from 'src/database/polymarket/event.schema';
import {
  Market,
  MarketDocument,
  UmaResolutionStatuses,
} from 'src/database/polymarket/market.schema';
import { Tag, TagDocument } from 'src/database/polymarket/tag.schema';
import { plainToInstance } from 'class-transformer';
import { omit } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

export enum ENUM_TAG {
  TRENDING = 'trending',
  POLITICS = 'politics',
  WORLD = 'world',
  SPORTS = 'sports',
  CRYPTO = 'crypto',
  TECH = 'tech',
  OTHER = 'other',
}

@Injectable()
export class PolyService {
  private readonly logger = new Logger(PolyService.name);

  constructor(
    @InjectModel(Market.name)
    private readonly marketModel: Model<Market>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
    @InjectModel(Tag.name)
    private readonly tagModel: Model<Tag>,
    private readonly polymarketService: PolymarketService,
  ) {}

  async initByVolume(createPolyDto: InitPolyCrerateDto) {
    const events = await this.polymarketService.fetchEvents({
      limit: createPolyDto.limit,
      offset: createPolyDto.offset,
      order: 'volume',
    });

    if (!events) {
      throw new HttpException('No events found', HttpStatus.NOT_FOUND);
    }
    const otherTag = await this.tagModel.findOne({
      slug: 'other',
    });

    if (!otherTag) {
      await this.tagModel.create({
        id: 999999999,
        slug: 'other',
        label: 'Other',
        forceShow: true,
      });
    }

    const updated = await this.updatePolyMarket(events);

    return {
      tags: updated.tags,
      events: updated.events,
      markets: updated.markets,
    };
  }

  async updatePolyMarket(events: PolymarketEventResponseData) {
    let marketCount = 0;

    // tags
    const tags: TagDocument[] = Array.from(
      new Map(
        events.data
          .map((event) => event.tags)
          .flat()
          .map((tag) => [tag.id, tag]),
      ).values(),
    ).map(
      (tag) =>
        new this.tagModel({
          id: tag.id,
          label: tag.label,
          slug: tag.slug,
          forceShow: tag.forceShow,
        }),
    );

    await Promise.all(
      tags.map(async (tag) => {
        try {
          await tag.save();
          this.logger.debug(`saving tag: ${tag.id}`);
        } catch (error) {
          this.logger.debug(`saving dupplicate tag: ${tag.id}`);
        }
      }),
    );

    // markets & events
    for (const event of events.data) {
      const eventDocument = await this.createEventDocument(event);

      const markets: MarketDocument[] = event.markets
        .filter((m) => {
          return m.volume !== '0';
        })
        .map((market) => this.createMarketDocument(market));

      const marketsIds: Types.ObjectId[] = [];

      for (const market of markets) {
        const checkMarket = await this.marketModel
          .findOneAndUpdate(
            { id: market.id },
            { ...market.toJSON() },
            {
              new: true,
              upsert: true,
            },
          )
          .catch((error) => {
            throw new HttpException(
              `update error market: ${market.id} (${market.slug}) ${error}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          });

        if (checkMarket) {
          marketsIds.push(checkMarket._id);
          marketCount++;
        } else {
          try {
            await market.save().catch((error) => {
              throw new HttpException(
                `saving error market: ${market.id} (${market.slug}) ${error}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
            marketCount++;
          } catch (error) {
            this.logger.error(
              `saving error market: ${market.id} (${market.slug})`,
              error,
            );
            throw new HttpException(
              `saving error market: ${market.id} (${market.slug})`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          marketsIds.push(market._id);
        }
      }

      const existingEvent = await this.eventModel.findOneAndUpdate(
        { id: eventDocument.id },
        eventDocument.toJSON(),
        { new: true },
      );

      if (existingEvent) {
        // Update existing event
        existingEvent.markets = marketsIds;
        await existingEvent.save();
        this.logger.debug(
          `update event: ${eventDocument.id} : (${markets.length} markets)`,
          event.slug,
        );
      } else {
        // Create new event
        eventDocument.markets = marketsIds;
        await eventDocument.save();

        this.logger.debug(
          `saving event: ${eventDocument.id} : (${markets.length} markets)`,
          event.slug,
        );
      }
    }

    return {
      tags: tags.length,
      events: events.data.length,
      markets: marketCount,
    };
  }

  createMarketDocument(market: MarketResponseItem): MarketDocument {
    const umaResolutionStatuses = JSON.parse(
      market.umaResolutionStatuses,
    ) as UmaResolutionStatuses[];

    const isProposed = umaResolutionStatuses.includes(
      UmaResolutionStatuses.PROPOSED,
    );

    const isResolved = umaResolutionStatuses.includes(
      UmaResolutionStatuses.RESOLVED,
    );

    const marketData = omit(market, ['createdAt', 'updatedAt']);

    return new this.marketModel({
      ...marketData,
      events: [],
      outcomePrices: JSON.parse(market.outcomePrices) as string[],
      outcomes: JSON.parse(market.outcomes) as string[],
      isProposed,
      isResolved,
      umaResolutionStatuses,
    });
  }

  async createEventDocument(event: PolymarketEvent): Promise<EventDocument> {
    const tagsFind = await this.tagModel.find({
      id: { $in: event.tags.map((tag) => tag.id) },
    });

    const eventData = omit(event, ['createdAt', 'updatedAt']);

    const tagCheck = event.tags.find((tag) =>
      Object.values(ENUM_TAG).includes(tag.slug as ENUM_TAG),
    );

    const tagId = tagCheck ? tagCheck.slug : ENUM_TAG.OTHER;

    const tagOurId = await this.tagModel.findOne({
      slug: tagId,
    });

    const eventDocument = new this.eventModel({
      ...eventData,
      markets: [],
      tags: tagsFind.map((tag) => tag._id),
      ourTagId: tagOurId ? tagOurId._id : null,
    });

    return eventDocument;
  }
}
