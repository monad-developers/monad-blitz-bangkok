import { MongoClient, Db } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb://betnad_user:betnad_password@localhost:27017/betnad";
let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("betnad");

    console.log("✅ Connected to MongoDB successfully");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db;
}
