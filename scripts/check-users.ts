import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db('peyaraful_cat_adoption');
  const users = await db.collection('users').find({}).project({ name: 1, email: 1, image: 1, googleId: 1 }).toArray();
  console.log(JSON.stringify(users, null, 2));
  await client.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
