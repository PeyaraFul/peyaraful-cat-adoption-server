import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, getDB } from '../src/config/db.js';

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureDB();
  } catch (e: any) {
    return res.status(500).json({ message: 'Database connection failed', detail: e?.message });
  }

  const url = new URL(req.url || '/', `https://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method || 'GET';

  try {
    const { getDB: db } = await import('../src/config/db.js');
    const database = db();

    if (path === '/api/health' && method === 'GET') {
      return res.json({ status: 'ok', message: 'Server is running' });
    }

    if (path === '/api/stats' && method === 'GET') {
      const totalCats = await database.collection('cats').countDocuments({ status: 'available' });
      const totalUsers = await database.collection('users').countDocuments();
      const totalAdoptions = await database.collection('adoption_requests').countDocuments({ status: 'approved' });
      return res.json({ totalCats, totalUsers, totalAdoptions });
    }

    const { default: jwt } = await import('jsonwebtoken');
    const { ObjectId } = await import('mongodb');

    let user: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
        const userDoc = await database.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
        if (userDoc) {
          user = {
            _id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            image: userDoc.image || '',
            role: userDoc.role || 'user',
            location: userDoc.location || '',
            phone: userDoc.phone || '',
            bio: userDoc.bio || '',
            createdAt: userDoc.createdAt,
          };
        }
      } catch {}
    }

    if (path === '/api/auth/google' && method === 'POST') {
      const { OAuth2Client } = await import('google-auth-library');
      const { credential } = req.body || {};
      if (!credential) return res.status(400).json({ message: 'Google credential is required' });

      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) return res.status(400).json({ message: 'Invalid Google credential' });

      const { sub: googleId, email, name, picture } = payload;
      const users = database.collection('users');
      let existingUser = await users.findOne({ $or: [{ googleId }, { email }] });

      if (existingUser) {
        const updates: any = {};
        if (!existingUser.googleId) updates.googleId = googleId;
        if (name && name !== existingUser.name) updates.name = name;
        if (picture && picture !== existingUser.image) updates.image = picture;
        if (Object.keys(updates).length > 0) {
          await users.updateOne({ _id: existingUser._id }, { $set: updates });
          existingUser = await users.findOne({ _id: existingUser._id });
        }
      } else {
        const newUser = { googleId, email, name: name || email.split('@')[0], image: picture || '', role: 'user' as const, location: '', phone: '', bio: '', createdAt: new Date(), updatedAt: new Date() };
        const result = await users.insertOne(newUser);
        existingUser = await users.findOne({ _id: result.insertedId });
      }

      const token = jwt.sign({ userId: existingUser!._id.toString() }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
      return res.json({ token, user: { _id: existingUser!._id.toString(), name: existingUser!.name, email: existingUser!.email, image: existingUser!.image || '', location: existingUser!.location || '', phone: existingUser!.phone || '', bio: existingUser!.bio || '', role: existingUser!.role || 'user', createdAt: existingUser!.createdAt } });
    }

    if (path === '/api/auth/me' && method === 'GET') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      return res.json(user);
    }

    if (path === '/api/auth/profile' && method === 'PUT') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const { name: n, phone, location, bio, image } = req.body || {};
      const updates: any = { updatedAt: new Date() };
      if (n !== undefined) updates.name = n.trim();
      if (phone !== undefined) updates.phone = (phone || '').trim();
      if (location !== undefined) updates.location = (location || '').trim();
      if (bio !== undefined) updates.bio = (bio || '').trim();
      if (image !== undefined) updates.image = (image || '').trim();
      await database.collection('users').updateOne({ _id: new ObjectId(user._id) }, { $set: updates });
      const updated = await database.collection('users').findOne({ _id: new ObjectId(user._id) });
      return res.json({ message: 'Profile updated successfully', user: { _id: updated?._id.toString(), name: updated?.name, email: updated?.email, image: updated?.image || '', location: updated?.location || '', phone: updated?.phone || '', bio: updated?.bio || '', role: updated?.role || 'user', createdAt: updated?.createdAt } });
    }

    if (path === '/api/auth/demo' && method === 'POST') {
      const users = database.collection('users');
      let demoUser = await users.findOne({ email: 'demo@user.com' });
      if (!demoUser) {
        const result = await users.insertOne({ email: 'demo@user.com', name: 'Demo User', image: '', role: 'user' as const, location: '', phone: '', bio: '', createdAt: new Date(), updatedAt: new Date() });
        demoUser = await users.findOne({ _id: result.insertedId });
      }
      const token = jwt.sign({ userId: demoUser!._id.toString() }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
      return res.json({ token, user: { _id: demoUser!._id.toString(), name: demoUser!.name, email: demoUser!.email, image: demoUser!.image || '', role: demoUser!.role || 'user', createdAt: demoUser!.createdAt } });
    }

    function escapeRegex(str: string) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    if (path === '/api/cats' && method === 'GET') {
      const { location, gender, age, search, page, limit } = Object.fromEntries(url.searchParams);
      const filter: any = { status: 'available' };
      if (location) filter.location = location;
      if (gender) filter.gender = gender;
      if (age) { const ageNum = parseInt(age, 10); if (!isNaN(ageNum)) filter.age = { $lte: ageNum }; }
      if (search) { const safe = escapeRegex(search); filter.$or = [{ name: { $regex: safe, $options: 'i' } }, { breed: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }]; }
      const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit || '12', 10) || 12));
      const skip = (pageNum - 1) * limitNum;
      const [cats, total] = await Promise.all([database.collection('cats').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(), database.collection('cats').countDocuments(filter)]);
      return res.json({ cats, total, page: pageNum, limit: limitNum });
    }

    const catIdMatch = path.match(/^\/api\/cats\/([a-fA-F0-9]+)$/);
    if (catIdMatch && method === 'GET') {
      const id = catIdMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid cat ID' });
      const cat = await database.collection('cats').findOne({ _id: new ObjectId(id) });
      if (!cat) return res.status(404).json({ message: 'Cat not found' });
      return res.json(cat);
    }

    if (path === '/api/cats' && method === 'POST') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const { name, age, breed, photo, description, location, gender, healthStatus, vaccinationStatus, temperament } = req.body || {};
      if (!name || !age || !breed || !photo || !location) return res.status(400).json({ message: 'Name, age, breed, photo, and location are required' });
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 0) return res.status(400).json({ message: 'Age must be a valid positive number' });
      const newCat = { ownerId: user._id, name: name.trim(), age: ageNum, breed: breed.trim(), photo: photo.trim(), description: (description || '').trim(), location: location.trim(), gender: gender || 'male', healthStatus: healthStatus || 'Healthy', vaccinationStatus: vaccinationStatus || 'Not vaccinated', temperament: temperament || '', status: 'available', createdAt: new Date(), updatedAt: new Date() };
      const result = await database.collection('cats').insertOne(newCat);
      return res.status(201).json({ message: 'Cat listing created successfully', cat: { ...newCat, _id: result.insertedId } });
    }

    if (catIdMatch && method === 'PUT') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const id = catIdMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid cat ID' });
      const cat = await database.collection('cats').findOne({ _id: new ObjectId(id) });
      if (!cat) return res.status(404).json({ message: 'Cat not found' });
      if (cat.ownerId !== user._id) return res.status(403).json({ message: 'You can only update your own cat listings' });
      const allowed = ['name', 'age', 'breed', 'photo', 'description', 'location', 'gender', 'healthStatus', 'vaccinationStatus', 'temperament'];
      const updates: any = { updatedAt: new Date() };
      for (const key of allowed) { if (req.body?.[key] !== undefined) updates[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key]; }
      await database.collection('cats').updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return res.json({ message: 'Cat updated successfully' });
    }

    if (catIdMatch && method === 'DELETE') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const id = catIdMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid cat ID' });
      const cat = await database.collection('cats').findOne({ _id: new ObjectId(id) });
      if (!cat) return res.status(404).json({ message: 'Cat not found' });
      if (cat.ownerId !== user._id && user.role !== 'admin') return res.status(403).json({ message: 'You can only delete your own cat listings' });
      await database.collection('cats').deleteOne({ _id: new ObjectId(id) });
      return res.json({ message: 'Cat deleted successfully' });
    }

    if (path === '/api/stories' && method === 'GET') {
      const stories = await database.collection('stories').find().sort({ createdAt: -1 }).toArray();
      return res.json(stories);
    }

    if (path === '/api/stories/top' && method === 'GET') {
      const stories = await database.collection('stories').find().sort({ likes: -1 }).limit(3).toArray();
      return res.json(stories);
    }

    if (path === '/api/stories' && method === 'POST') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const { catName, content, image } = req.body || {};
      if (!catName || !content) return res.status(400).json({ message: 'Cat name and content are required' });
      const newStory = { userId: user._id, userName: user.name, userImage: user.image || '', catName: catName.trim(), content: content.trim(), image: (image || '').trim(), likes: 0, likedBy: [], createdAt: new Date() };
      const result = await database.collection('stories').insertOne(newStory);
      return res.status(201).json({ message: 'Story created successfully', story: { ...newStory, _id: result.insertedId } });
    }

    const storyLikeMatch = path.match(/^\/api\/stories\/([a-fA-F0-9]+)\/like$/);
    if (storyLikeMatch && method === 'POST') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const id = storyLikeMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid story ID' });
      const story = await database.collection('stories').findOne({ _id: new ObjectId(id) });
      if (!story) return res.status(404).json({ message: 'Story not found' });
      const likedBy: string[] = story.likedBy || [];
      const alreadyLiked = likedBy.includes(user._id);
      if (alreadyLiked) {
        await database.collection('stories').updateOne({ _id: new ObjectId(id) }, { $inc: { likes: -1 }, $pull: { likedBy: user._id } });
      } else {
        await database.collection('stories').updateOne({ _id: new ObjectId(id) }, { $inc: { likes: 1 }, $addToSet: { likedBy: user._id } });
      }
      const updated = await database.collection('stories').findOne({ _id: new ObjectId(id) });
      return res.json({ likes: updated!.likes, liked: !alreadyLiked });
    }

    const storyDeleteMatch = path.match(/^\/api\/stories\/([a-fA-F0-9]+)$/);
    if (storyDeleteMatch && method === 'DELETE') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const id = storyDeleteMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid story ID' });
      const story = await database.collection('stories').findOne({ _id: new ObjectId(id) });
      if (!story) return res.status(404).json({ message: 'Story not found' });
      if (story.userId !== user._id && user.role !== 'admin') return res.status(403).json({ message: 'You can only delete your own stories' });
      await database.collection('stories').deleteOne({ _id: new ObjectId(id) });
      return res.json({ message: 'Story deleted successfully' });
    }

    if (path === '/api/adoptions' && method === 'POST') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const { catId, message } = req.body || {};
      if (!catId) return res.status(400).json({ message: 'Cat ID is required' });
      if (!ObjectId.isValid(catId)) return res.status(400).json({ message: 'Invalid cat ID' });
      const cat = await database.collection('cats').findOne({ _id: new ObjectId(catId) });
      if (!cat) return res.status(404).json({ message: 'Cat not found' });
      if (cat.ownerId === user._id) return res.status(400).json({ message: 'You cannot adopt your own cat' });
      const existing = await database.collection('adoption_requests').findOne({ catId, requesterId: user._id, status: 'pending' });
      if (existing) return res.status(400).json({ message: 'You already have a pending request for this cat' });
      let ownerName = '', ownerEmail = '';
      if (cat.ownerId) { const owner = await database.collection('users').findOne({ _id: new ObjectId(cat.ownerId) }); if (owner) { ownerName = owner.name || ''; ownerEmail = owner.email || ''; } }
      const newRequest = { catId, catName: cat.name, catPhoto: cat.photo, requesterId: user._id, requesterName: user.name, requesterEmail: user.email, ownerId: cat.ownerId, ownerName, ownerEmail, status: 'pending', message: message || '', createdAt: new Date() };
      const result = await database.collection('adoption_requests').insertOne(newRequest);
      return res.status(201).json({ message: 'Adoption request sent successfully', request: { ...newRequest, _id: result.insertedId } });
    }

    if (path === '/api/adoptions/received' && method === 'GET') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const requests = await database.collection('adoption_requests').find({ ownerId: user._id }).sort({ createdAt: -1 }).toArray();
      return res.json(requests);
    }

    if (path === '/api/adoptions/sent' && method === 'GET') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const requests = await database.collection('adoption_requests').find({ requesterId: user._id }).sort({ createdAt: -1 }).toArray();
      return res.json(requests);
    }

    const adoptApproveMatch = path.match(/^\/api\/adoptions\/([a-fA-F0-9]+)\/approve$/);
    if (adoptApproveMatch && method === 'PUT') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const id = adoptApproveMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid request ID' });
      const updated = await database.collection('adoption_requests').findOneAndUpdate({ _id: new ObjectId(id), ownerId: user._id, status: 'pending' }, { $set: { status: 'approved', updatedAt: new Date() } }, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ message: 'Request not found or already processed' });
      await database.collection('cats').updateOne({ _id: new ObjectId(updated.catId) }, { $set: { status: 'adopted', updatedAt: new Date() } });
      return res.json({ message: 'Request approved successfully' });
    }

    const adoptRejectMatch = path.match(/^\/api\/adoptions\/([a-fA-F0-9]+)\/reject$/);
    if (adoptRejectMatch && method === 'PUT') {
      if (!user) return res.status(401).json({ message: 'No token provided' });
      const id = adoptRejectMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid request ID' });
      const updated = await database.collection('adoption_requests').findOneAndUpdate({ _id: new ObjectId(id), ownerId: user._id, status: 'pending' }, { $set: { status: 'rejected', updatedAt: new Date() } }, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ message: 'Request not found or already processed' });
      return res.json({ message: 'Request rejected' });
    }

    if (path === '/api/admin/stats' && method === 'GET') {
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const totalCats = await database.collection('cats').countDocuments();
      const totalUsers = await database.collection('users').countDocuments();
      const totalAdoptions = await database.collection('adoption_requests').countDocuments({ status: 'approved' });
      const pendingAdoptions = await database.collection('adoption_requests').countDocuments({ status: 'pending' });
      const rejectedAdoptions = await database.collection('adoption_requests').countDocuments({ status: 'rejected' });
      const catsByStatus = { available: await database.collection('cats').countDocuments({ status: 'available' }), pending: await database.collection('cats').countDocuments({ status: 'pending' }), adopted: await database.collection('cats').countDocuments({ status: 'adopted' }) };
      const now = new Date();
      const catsPerMonth: { month: string; count: number }[] = [];
      const usersPerMonth: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });
        catsPerMonth.push({ month: label, count: await database.collection('cats').countDocuments({ createdAt: { $gte: start, $lte: end } }) });
        usersPerMonth.push({ month: label, count: await database.collection('users').countDocuments({ createdAt: { $gte: start, $lte: end } }) });
      }
      return res.json({ totalCats, totalUsers, totalAdoptions, pendingAdoptions, rejectedAdoptions, catsByStatus, catsPerMonth, usersPerMonth });
    }

    if (path === '/api/admin/users' && method === 'GET') {
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const users = await database.collection('users').find().project({ googleId: 0 }).sort({ createdAt: -1 }).toArray();
      return res.json(users);
    }

    const adminUserDeleteMatch = path.match(/^\/api\/admin\/users\/([a-fA-F0-9]+)$/);
    if (adminUserDeleteMatch && method === 'DELETE') {
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const id = adminUserDeleteMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user ID' });
      if (user._id === id) return res.status(400).json({ message: 'Admin cannot delete themselves' });
      const targetUser = await database.collection('users').findOne({ _id: new ObjectId(id) });
      if (!targetUser) return res.status(404).json({ message: 'User not found' });
      await database.collection('users').deleteOne({ _id: new ObjectId(id) });
      return res.json({ message: 'User deleted successfully' });
    }

    if (path === '/api/admin/cats' && method === 'GET') {
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const cats = await database.collection('cats').find().sort({ createdAt: -1 }).toArray();
      return res.json(cats);
    }

    const adminCatDeleteMatch = path.match(/^\/api\/admin\/cats\/([a-fA-F0-9]+)$/);
    if (adminCatDeleteMatch && method === 'DELETE') {
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const id = adminCatDeleteMatch[1];
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid cat ID' });
      const cat = await database.collection('cats').findOne({ _id: new ObjectId(id) });
      if (!cat) return res.status(404).json({ message: 'Cat not found' });
      await database.collection('cats').deleteOne({ _id: new ObjectId(id) });
      await database.collection('adoption_requests').deleteMany({ catId: id });
      return res.json({ message: 'Cat deleted successfully' });
    }

    if (path === '/api/admin/adoptions' && method === 'GET') {
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const { status } = Object.fromEntries(url.searchParams);
      const filter: any = {};
      if (status) filter.status = status;
      const adoptions = await database.collection('adoption_requests').find(filter).sort({ createdAt: -1 }).toArray();
      return res.json(adoptions);
    }

    if (path === '/api/chat' && method === 'POST') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const { messages } = req.body || {};
      if (!messages || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ message: 'Messages array is required' });

      const availableCats = await database.collection('cats').find({ status: 'available' }).sort({ createdAt: -1 }).limit(20).project({ name: 1, breed: 1, age: 1, location: 1, gender: 1, temperament: 1, healthStatus: 1, description: 1 }).toArray();
      const catContext = availableCats.length > 0 ? `\n\nCURRENT AVAILABLE CATS ON THE PLATFORM:\n${availableCats.map((c: any) => `- ${c.name} (${c.breed}, ${c.age} months, ${c.gender}, ${c.location})${c.temperament ? " — Temperament: " + c.temperament : ""}${c.healthStatus ? " — Health: " + c.healthStatus : ""}`).join('\n')}` : '\n\nNo cats are currently available for adoption.';

      const SYSTEM_PROMPT = `You are Peyaraful's friendly cat adoption assistant. You help users with:\n1. Cat care advice (feeding, health, grooming, behavior, litter training)\n2. Finding available cats from the Peyaraful platform\n3. Answering questions about the adoption process\n4. General cat knowledge and fun facts\n\nGuidelines:\n- Be warm, friendly, and concise\n- Use emoji sparingly (1-2 per message max)\n- When users ask about available cats, refer to the CURRENT AVAILABLE CATS data provided below\n- If you don't know something specific about a cat, direct them to the cats page\n- Keep responses under 150 words unless detail is needed\n- Always encourage adoption and responsible pet ownership` + catContext;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash', systemInstruction: SYSTEM_PROMPT });
      const history = messages.slice(-20).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(messages[messages.length - 1].content);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (error: any) {
    console.error('API Error:', error?.message || error);
    return res.status(500).json({ message: 'Server error', detail: error?.message });
  }
}

export const config = { api: { bodyParser: false } };
