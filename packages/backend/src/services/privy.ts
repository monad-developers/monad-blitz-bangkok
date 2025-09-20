import { PrivyClient } from "@privy-io/server-auth";
import env from "../config/env";
import { PrivyWallet } from "../models/PrivyWallet";
import { WalletEntity, IPrivyWallet } from "../types";

const { privy } = env;

// Initialize Privy client with your API key
export const privyClient = new PrivyClient(privy.appId, privy.appSecret);

// Wallet mapper utility
const walletMapper = {
  toDomain: (wallet: IPrivyWallet): WalletEntity => ({
    id: wallet._id || "",
    userId: wallet.userId,
    privyWalletId: wallet.privyWalletId,
    address: wallet.address,
    chainType: wallet.chainType,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  }),
};

export class PrivyService {
  async createWallet(userId: string): Promise<WalletEntity> {
    const existingWallet = await PrivyWallet.findOne({ userId });
    if (existingWallet) {
      throw new Error("Wallet already exists");
    }

    console.log(`Creating new wallet for user ${userId}`);
    const { id, address, chainType } = await privyClient.walletApi.createWallet(
      {
        chainType: "ethereum",
      }
    );

    const walletData = {
      userId,
      privyWalletId: id,
      address,
      chainType,
    };

    const savedWallet: IPrivyWallet = await PrivyWallet.save(walletData);
    return walletMapper.toDomain(savedWallet);
  }

  async getWalletAccount(userId: string): Promise<IPrivyWallet> {
    const wallet = await PrivyWallet.findOne({ userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return wallet;
  }
}
