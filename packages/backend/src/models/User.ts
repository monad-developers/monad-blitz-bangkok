import { User } from "../types";
import { getDatabase } from "../utils/mongodb";

export class UserModel {
  private static collection = "users";

  static async createOrUpdate(user: User): Promise<User> {
    const db = getDatabase();
    const collection = db.collection<User>(this.collection);

    const now = new Date();
    const userData = {
      ...user,
      updatedAt: now,
    };

    const result = await collection.findOneAndUpdate(
      { uid: user.uid },
      {
        $set: userData,
        $setOnInsert: { createdAt: now },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (!result) {
      throw new Error("Failed to create or update user");
    }

    return result;
  }

  static async findByUid(uid: string): Promise<User | null> {
    const db = getDatabase();
    const collection = db.collection<User>(this.collection);
    return await collection.findOne({ uid });
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    const collection = db.collection<User>(this.collection);
    return await collection.findOne({ email });
  }

  static async findByTwitterId(twitterId: string): Promise<User | null> {
    const db = getDatabase();
    const collection = db.collection<User>(this.collection);
    return await collection.findOne({ twitterId });
  }

  static async updateWalletAddress(
    uid: string,
    walletAddress: string
  ): Promise<User | null> {
    const db = getDatabase();
    const collection = db.collection<User>(this.collection);

    const result = await collection.findOneAndUpdate(
      { uid },
      {
        $set: {
          walletAddress,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result;
  }

  static async delete(uid: string): Promise<boolean> {
    const db = getDatabase();
    const collection = db.collection<User>(this.collection);

    const result = await collection.deleteOne({ uid });
    return result.deletedCount > 0;
  }
}
