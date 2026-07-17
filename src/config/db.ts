import { MongoClient, Db } from 'mongodb';

const dbName = 'peyaraful_cat_adoption';

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  console.log('Connected to MongoDB');
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}
