import { MongoClient, Db } from 'mongodb';

const dbName = 'peyaraful_cat_adoption';

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
  mongoDb?: Db;
};

export async function connectDB(): Promise<Db> {
  if (globalForMongo.mongoDb) return globalForMongo.mongoDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const client = new MongoClient(uri);
  await client.connect();
  globalForMongo.mongoClient = client;
  globalForMongo.mongoDb = client.db(dbName);

  console.log('Connected to MongoDB');
  return globalForMongo.mongoDb;
}

export function getDB(): Db {
  if (!globalForMongo.mongoDb) throw new Error('Database not connected. Call connectDB() first.');
  return globalForMongo.mongoDb;
}
