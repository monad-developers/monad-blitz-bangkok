import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PolyService } from 'src/core/services/poly.service';
import { Market } from 'src/database/polymarket/market.schema';
import { Tag } from 'src/database/polymarket/tag.schema';

@Injectable()
export class PolyUserService {
  constructor(
    @InjectModel(Market.name)
    private readonly marketModel: Model<Market>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
    @InjectModel(Tag.name)
    private readonly tagModel: Model<Tag>,
    private readonly polyService: PolyService,
  ) {}

  async getEventsPaginate({
    tagId,
    limit,
    offset,
  }: {
    tagId?: string;
    limit: number;
    offset: number;
  }) {
    const query = tagId ? { ourTagId: tagId } : {};
    const total = await this.eventModel.countDocuments(query);
    const events = await this.eventModel
      .find(query)
      .skip(offset)
      .limit(limit)
      .populate('tags')
      .populate('markets')
      .populate('ourTagId')
      .exec();
    return {
      events,
      paginate: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getTags() {
    const tags = await this.eventModel.aggregate([
      { $unwind: '$ourTagId' },
      { $group: { _id: '$ourTagId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'tags',
          localField: '_id',
          foreignField: '_id',
          as: 'tagDetails',
        },
      },
      { $unwind: '$tagDetails' },
      { $project: { _id: 0, tag: '$tagDetails', count: 1 } },
    ]);

    const tagsSort = tags.sort((a, b) => b.count - a.count);
    const tagResult = tagsSort.map((tag) => ({
      ...tag.tag,
      total: tag.count as number,
    }));
    return tagResult;
  }

  async getEventBySlug(slug: string) {
    const event = await this.eventModel
      .findOne({ slug })
      .populate('tags')
      .populate('markets')
      .populate('ourTagId');
    return event;
  }
}
