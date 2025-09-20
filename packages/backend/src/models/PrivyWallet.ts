import { getDatabase } from "../utils/mongodb";
import { IPrivyWallet } from "../types";
import { createGasTankService } from "../services/gasTank";
import env from "../config/env";

export class PrivyWallet {
  private static collection = "privy_wallets";

  static async findOne(
    query: Partial<IPrivyWallet>
  ): Promise<IPrivyWallet | null> {
    const db = getDatabase();
    const collection = db.collection<IPrivyWallet>(this.collection);
    return await collection.findOne(query);
  }

  static async create(
    walletData: Omit<IPrivyWallet, "_id" | "createdAt" | "updatedAt">
  ): Promise<IPrivyWallet> {
    const db = getDatabase();
    const collection = db.collection<IPrivyWallet>(this.collection);

    const now = new Date();
    const newWallet: IPrivyWallet = {
      ...walletData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newWallet);

    if (!result.insertedId) {
      throw new Error("Failed to create wallet");
    }

    const createdWallet = {
      ...newWallet,
      _id: result.insertedId.toString(),
    };

    // Call supportGas only for first-time wallet creation
    try {
      const gasTankService = createGasTankService({
        privateKey: env.gasTank.privateKey,
        gasAmount: env.gasTank.amount,
        rpcUrl: env.gasTank.rpcUrl,
      });

      const gasSupportResult = await gasTankService.supportGas(
        walletData.address
      );

      if (gasSupportResult.success) {
        console.log(
          `Gas support sent to new wallet ${walletData.address}: ${gasSupportResult.amount} MON`
        );
      } else {
        console.log(
          `Gas support not sent to wallet ${walletData.address}: ${gasSupportResult.message}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to send gas support to wallet ${walletData.address}:`,
        error
      );
      // Don't throw error here as wallet creation should succeed even if gas support fails
    }

    return createdWallet;
  }

  static async save(
    walletData: Omit<IPrivyWallet, "_id" | "createdAt" | "updatedAt">
  ): Promise<IPrivyWallet> {
    return this.create(walletData);
  }

  static async findByUserId(userId: string): Promise<IPrivyWallet | null> {
    return this.findOne({ userId });
  }

  static async update(
    userId: string,
    updateData: Partial<Omit<IPrivyWallet, "_id" | "userId" | "createdAt">>
  ): Promise<IPrivyWallet | null> {
    const db = getDatabase();
    const collection = db.collection<IPrivyWallet>(this.collection);

    const result = await collection.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result;
  }

  static async delete(userId: string): Promise<boolean> {
    const db = getDatabase();
    const collection = db.collection<IPrivyWallet>(this.collection);

    const result = await collection.deleteOne({ userId });
    return result.deletedCount > 0;
  }
}
