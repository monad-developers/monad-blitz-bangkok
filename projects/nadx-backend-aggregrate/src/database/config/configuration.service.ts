import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Configuration, ConfigurationDocument } from './configuration.schema';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectModel(Configuration.name)
    private configModel: Model<ConfigurationDocument>,
  ) {}

  async getConfigValue(key: string): Promise<string | null> {
    const config = await this.configModel
      .findOne({ key })
      .sort({ createdAt: -1 })
      .exec();
    return config ? config.value : null;
  }

  async getConfig(key: string): Promise<ConfigurationDocument | null> {
    const config = await this.configModel
      .findOne({ key })
      .sort({ createdAt: -1 })
      .exec();
    return config;
  }

  async setConfigValue(
    key: string,
    value: any,
    description: string,
  ): Promise<ConfigurationDocument> {
    const config = new this.configModel({
      key,
      value: JSON.stringify(value),
      description,
    });
    await config.save();
    return config;
  }
}
