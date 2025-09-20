import { Poll } from "../types";
import { getDatabase } from "../utils/mongodb";

export class PollModel {
  private static collection = "polls";

  static async create(poll: Omit<Poll, '_id' | 'createdAt' | 'updatedAt'>): Promise<Poll> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    const now = new Date();
    const pollData: Poll = {
      ...poll,
      totalVotes: 0,
      yesVotes: 0,
      noVotes: 0,
      status: poll.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(pollData);

    if (!result.insertedId) {
      throw new Error("Failed to create poll");
    }

    return {
      ...pollData,
      _id: result.insertedId.toString(),
    };
  }

  static async findById(id: string): Promise<Poll | null> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    try {
      const { ObjectId } = await import('mongodb');
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      return null;
    }
  }

  static async findAll(filters: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ polls: Poll[]; total: number }> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    const query: any = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const [polls, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ]);

    return { polls, total };
  }

  static async findByCreatedBy(createdBy: string): Promise<Poll[]> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    return await collection
      .find({ createdBy })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async updateById(id: string, updates: Partial<Poll>): Promise<Poll | null> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    try {
      const { ObjectId } = await import('mongodb');
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      return result || null;
    } catch (error) {
      return null;
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    try {
      const { ObjectId } = await import('mongodb');
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      return false;
    }
  }

  static async getCategories(): Promise<string[]> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    const categories = await collection.distinct("category", {
      category: { $ne: null, $ne: "" }
    });

    return categories.sort();
  }

  static async incrementVotes(id: string, voteType: 'yes' | 'no'): Promise<Poll | null> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    try {
      const { ObjectId } = await import('mongodb');
      const updateField = voteType === 'yes' ? 'yesVotes' : 'noVotes';

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $inc: {
            [updateField]: 1,
            totalVotes: 1,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      return result || null;
    } catch (error) {
      return null;
    }
  }

  static async getActivePolls(): Promise<Poll[]> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    const now = new Date();

    return await collection
      .find({
        status: 'active',
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async closeExpiredPolls(): Promise<number> {
    const db = getDatabase();
    const collection = db.collection<Poll>(this.collection);

    const now = new Date();

    const result = await collection.updateMany(
      {
        status: 'active',
        expiresAt: { $lte: now }
      },
      {
        $set: {
          status: 'closed',
          updatedAt: now,
        },
      }
    );

    return result.modifiedCount;
  }
}