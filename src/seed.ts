import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

const DB_NAME = 'peyaraful_cat_adoption';

const catPhotos = [
  'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg',
  'https://cdn2.thecatapi.com/images/MTk3ODc3Mw.jpg',
  'https://cdn2.thecatapi.com/images/1d5p0r8l5.jpg',
  'https://cdn2.thecatapi.com/images/ai6Jps8sx.jpg',
  'https://cdn2.thecatapi.com/images/eih1p0rzN.jpg',
  'https://cdn2.thecatapi.com/images/5kA3e4o8q.jpg',
  'https://cdn2.thecatapi.com/images/56h3r9o8p.jpg',
  'https://cdn2.thecatapi.com/images/8d6dq8k9p.jpg',
];

const storyImages = [
  'https://cdn2.thecatapi.com/images/2l3f0r8l5.jpg',
  'https://cdn2.thecatapi.com/images/3m4n5o6p.jpg',
  'https://cdn2.thecatapi.com/images/4p5q6r7s.jpg',
  'https://cdn2.thecatapi.com/images/5r6s7t8u.jpg',
  'https://cdn2.thecatapi.com/images/6s7t8u9v.jpg',
  'https://cdn2.thecatapi.com/images/7t8u9v0w.jpg',
  'https://cdn2.thecatapi.com/images/8u9v0w1x.jpg',
  'https://cdn2.thecatapi.com/images/9v0w1x2y.jpg',
];

const userPhotos = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
];

const users = [
  { name: 'Rahim Ahmed', email: 'rahim@example.com', image: userPhotos[0], location: 'Dhaka', phone: '+880 1712345678', bio: 'Cat lover since childhood. Currently have 2 cats at home.', role: 'admin', createdAt: new Date('2024-01-15') },
  { name: 'Fatima Khan', email: 'fatima@example.com', image: userPhotos[1], location: 'Chattogram', phone: '+880 1812345678', bio: 'Volunteer at a local animal shelter.', role: 'user', createdAt: new Date('2024-02-10') },
  { name: 'Karim Hassan', email: 'karim@example.com', image: userPhotos[2], location: 'Sylhet', phone: '+880 1912345678', bio: 'Moved to a new apartment that allows pets. Looking for a companion.', role: 'user', createdAt: new Date('2024-03-05') },
  { name: 'Nadia Islam', email: 'nadia@example.com', image: userPhotos[3], location: 'Rajshahi', phone: '+880 1612345678', bio: 'Graphic designer who works from home. Plenty of time for a pet.', role: 'user', createdAt: new Date('2024-04-20') },
  { name: 'Tanvir Rahman', email: 'tanvir@example.com', image: userPhotos[4], location: 'Dhaka', phone: '+880 1512345678', bio: 'Software engineer. Cat person through and through.', role: 'user', createdAt: new Date('2024-05-12') },
  { name: 'Sabrina Akter', email: 'sabrina@example.com', image: userPhotos[5], location: 'Khulna', phone: '+880 1712987654', bio: 'Teacher who loves animals. Have experience with cats.', role: 'user', createdAt: new Date('2024-06-01') },
  { name: 'Mehedi Hasan', email: 'mehedi@example.com', image: userPhotos[6], location: 'Barishal', phone: '+880 1812987654', bio: 'College student looking for a low-maintenance pet.', role: 'user', createdAt: new Date('2024-07-15') },
  { name: 'Ruma Begum', email: 'ruma@example.com', image: userPhotos[7], location: 'Rangpur', phone: '+880 1912987654', bio: 'Retired nurse. Want a cat for companionship.', role: 'user', createdAt: new Date('2024-08-20') },
];

const cats = [
  { ownerId: 0, name: 'Choco', age: 8, breed: 'Persian', photo: catPhotos[0], description: 'A gentle and calm Persian cat who loves to lounge around. Great with kids.', location: 'Dhaka', gender: 'male', healthStatus: 'Healthy', vaccinationStatus: 'Fully vaccinated', temperament: 'Calm, gentle', status: 'available', createdAt: new Date('2024-10-01') },
  { ownerId: 0, name: 'Luna', age: 5, breed: 'Siamese', photo: catPhotos[1], description: 'Playful Siamese with striking blue eyes. Very vocal and affectionate.', location: 'Dhaka', gender: 'female', healthStatus: 'Healthy', vaccinationStatus: 'Fully vaccinated', temperament: 'Playful, vocal', status: 'available', createdAt: new Date('2024-10-05') },
  { ownerId: 1, name: 'Milo', age: 12, breed: 'British Shorthair', photo: catPhotos[2], description: 'Chubby and adorable British Shorthair. Loves food and nap time.', location: 'Chattogram', gender: 'male', healthStatus: 'Healthy', vaccinationStatus: 'Fully vaccinated', temperament: 'Lazy, foodie', status: 'available', createdAt: new Date('2024-10-10') },
  { ownerId: 2, name: 'Bella', age: 6, breed: 'Maine Coon', photo: catPhotos[3], description: 'Large and majestic Maine Coon. Surprisingly gentle for her size.', location: 'Sylhet', gender: 'female', healthStatus: 'Healthy', vaccinationStatus: 'Partially vaccinated', temperament: 'Gentle, majestic', status: 'available', createdAt: new Date('2024-10-15') },
  { ownerId: 3, name: 'Oliver', age: 10, breed: 'Ragdoll', photo: catPhotos[4], description: 'Classic Ragdoll who goes limp when you pick him up. Very trusting.', location: 'Rajshahi', gender: 'male', healthStatus: 'Minor allergy', vaccinationStatus: 'Fully vaccinated', temperament: 'Docile, trusting', status: 'available', createdAt: new Date('2024-10-20') },
  { ownerId: 4, name: 'Nala', age: 4, breed: 'Bengal', photo: catPhotos[5], description: 'Energetic Bengal with stunning spotted coat. Needs an active owner.', location: 'Dhaka', gender: 'female', healthStatus: 'Healthy', vaccinationStatus: 'Fully vaccinated', temperament: 'Energetic, curious', status: 'pending', createdAt: new Date('2024-10-25') },
  { ownerId: 5, name: 'Simba', age: 18, breed: 'Mixed', photo: catPhotos[6], description: 'Senior mixed breed with a heart of gold. Very wise and peaceful.', location: 'Khulna', gender: 'male', healthStatus: 'Healthy', vaccinationStatus: 'Fully vaccinated', temperament: 'Peaceful, wise', status: 'available', createdAt: new Date('2024-11-01') },
  { ownerId: 6, name: 'Cleo', age: 3, breed: 'Abyssinian', photo: catPhotos[7], description: 'Adventurous Abyssinian who loves to climb. Will keep you entertained.', location: 'Barishal', gender: 'female', healthStatus: 'Healthy', vaccinationStatus: 'Fully vaccinated', temperament: 'Adventurous, active', status: 'available', createdAt: new Date('2024-11-05') },
];

const stories = [
  { userId: 0, catName: 'Mochi', content: 'I adopted Mochi from Peyaraful three months ago and he has completely transformed our household. He greets me at the door every evening and loves to curl up on my lap while I read. Best decision ever!', likes: 24, createdAt: new Date('2024-09-15') },
  { userId: 1, catName: 'Tiger', content: 'Tiger was so shy when we first got him. After two weeks of patience and love, he became the most affectionate cat I have ever known. Now he follows me everywhere in the house.', likes: 18, createdAt: new Date('2024-09-20') },
  { userId: 2, catName: 'Snowball', content: 'Snowball adjusted to our home in just three days! She immediately claimed the sunny window spot and now supervises everything we do. She even learned to high-five.', likes: 31, createdAt: new Date('2024-09-25') },
  { userId: 3, catName: 'Shadow', content: 'Shadow is the perfect cat for someone who works from home. He sits on my desk quietly while I code and occasionally demands pets. Such a gentleman.', likes: 15, createdAt: new Date('2024-10-01') },
  { userId: 4, catName: 'Kitty', content: 'Our daughter was nervous about getting a pet but Kitty won her over instantly. They are now inseparable. Kitty even sleeps on her bed every night. Thank you Peyaraful!', likes: 42, createdAt: new Date('2024-10-05') },
  { userId: 5, catName: 'Patches', content: 'Patches had some health issues when we adopted him but with proper care he made a full recovery. He is now the healthiest and happiest cat. Never give up on rescue cats!', likes: 37, createdAt: new Date('2024-10-10') },
  { userId: 6, catName: 'Whiskers', content: 'Whiskers helped me through a really tough time. His purring is the most therapeutic sound. I cannot imagine life without him now. Adopt, do not shop!', likes: 29, createdAt: new Date('2024-10-15') },
  { userId: 7, catName: 'Ginger', content: 'Ginger is the most photogenic cat ever. Her Instagram already has 500 followers! She loves posing for the camera and playing with her feather toy. A true social media star.', likes: 53, createdAt: new Date('2024-10-20') },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('Dropping existing collections...');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.dropCollection(col.name);
    }

    // Insert users
    console.log('Inserting 8 users...');
    const userDocs = users.map((u) => ({ _id: new ObjectId(), ...u }));
    await db.collection('users').insertMany(userDocs);

    // Insert cats (replace ownerId index with actual user _id)
    console.log('Inserting 8 cats...');
    const catDocs = cats.map((c) => ({
      _id: new ObjectId(),
      ownerId: userDocs[c.ownerId]._id.toString(),
      name: c.name,
      age: c.age,
      breed: c.breed,
      photo: c.photo,
      description: c.description,
      location: c.location,
      gender: c.gender,
      healthStatus: c.healthStatus,
      vaccinationStatus: c.vaccinationStatus,
      temperament: c.temperament,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.createdAt,
    }));
    await db.collection('cats').insertMany(catDocs);

    // Insert stories
    console.log('Inserting 8 stories...');
    const storyDocs = stories.map((s, i) => ({
      _id: new ObjectId(),
      userId: userDocs[s.userId]._id.toString(),
      userName: userDocs[s.userId].name,
      userImage: userDocs[s.userId].image || '',
      catName: s.catName,
      content: s.content,
      image: storyImages[i],
      likes: s.likes,
      createdAt: s.createdAt,
    }));
    await db.collection('stories').insertMany(storyDocs);

    // Insert adoption requests (mix of statuses)
    console.log('Inserting 8 adoption requests...');
    const statuses = ['pending', 'pending', 'pending', 'approved', 'approved', 'rejected', 'pending', 'approved'];
    const adoptionDocs = Array.from({ length: 8 }, (_, i) => {
      const requester = userDocs[i % 4 + 4];
      const cat = catDocs[i];
      return {
        _id: new ObjectId(),
        catId: cat._id.toString(),
        catName: cat.name,
        catPhoto: cat.photo,
        requesterId: requester._id.toString(),
        requesterName: requester.name,
        requesterEmail: requester.email,
        ownerId: cat.ownerId,
        ownerName: userDocs[cat.ownerId === userDocs[0]._id.toString() ? 0 : catDocs.findIndex((c) => c.ownerId === cat.ownerId)].name,
        ownerEmail: userDocs[cat.ownerId === userDocs[0]._id.toString() ? 0 : catDocs.findIndex((c) => c.ownerId === cat.ownerId)].email,
        status: statuses[i],
        message: [
          'I would love to adopt this cat. I have a big apartment.',
          'My kids have been asking for a cat for months!',
          'I work from home and can give lots of attention.',
          'I have experience with this breed specifically.',
          'Looking for a companion for my existing cat.',
          'I live in a quiet neighborhood perfect for cats.',
          'I can provide regular vet checkups.',
          'This cat reminds me of my childhood pet.',
        ][i],
        createdAt: new Date(Date.now() - (8 - i) * 86400000),
        updatedAt: statuses[i] !== 'pending' ? new Date(Date.now() - (8 - i) * 43200000) : undefined,
      };
    });
    await db.collection('adoption_requests').insertMany(adoptionDocs);

    console.log('Seed complete!');
    console.log(`  Users: ${userDocs.length}`);
    console.log(`  Cats: ${catDocs.length}`);
    console.log(`  Stories: ${storyDocs.length}`);
    console.log(`  Adoption Requests: ${adoptionDocs.length}`);
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await client.close();
  }
}

seed();
