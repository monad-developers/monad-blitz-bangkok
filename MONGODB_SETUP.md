# MongoDB Setup for BetNad

This project includes Docker Compose configuration for running MongoDB locally.

## Quick Start

1. **Start MongoDB:**

   ```bash
   docker-compose up -d
   ```

2. **Stop MongoDB:**

   ```bash
   docker-compose down
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f mongodb
   ```

## Services

### MongoDB

- **Port:** 27017
- **Admin Username:** admin
- **Admin Password:** password
- **Database:** betnad
- **App Username:** betnad_user
- **App Password:** betnad_password

## Connection Strings

### For local development (outside Docker):

```
mongodb://betnad_user:betnad_password@localhost:27017/betnad
```

### For applications running in Docker:

```
mongodb://betnad_user:betnad_password@mongodb:27017/betnad
```

## Data Persistence

MongoDB data is persisted in a Docker volume named `mongodb_data`. This means your data will survive container restarts.

To completely remove all data:

```bash
docker-compose down -v
```

## Initialization

The database is automatically initialized with:

- A `betnad` database
- A `betnad_user` with read/write permissions
- Sample collections: `users`, `bets`, `events`
- Sample data for testing

## Integration with Scaffold-ETH 2

To use MongoDB in your Next.js application:

1. Install MongoDB driver:

   ```bash
   cd packages/nextjs
   yarn add mongodb
   ```

2. Create a MongoDB connection utility:

   ```typescript
   // packages/nextjs/lib/mongodb.ts
   import { MongoClient } from "mongodb";

   const uri =
     process.env.MONGODB_URI ||
     "mongodb://betnad_user:betnad_password@localhost:27017/betnad";
   const client = new MongoClient(uri);

   export async function connectToDatabase() {
     await client.connect();
     return client.db("betnad");
   }
   ```

3. Use in your API routes or server components:

   ```typescript
   import { connectToDatabase } from "@/lib/mongodb";

   export async function GET() {
     const db = await connectToDatabase();
     const users = await db.collection("users").find({}).toArray();
     return Response.json(users);
   }
   ```
