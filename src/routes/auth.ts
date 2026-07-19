import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const JWT_EXPIRES_IN = '7d';

function getGoogleClientId() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('GOOGLE_CLIENT_ID is not defined');
  return id;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in environment variables');
  return secret;
}

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const clientId = getGoogleClientId();
    const googleClient = new OAuth2Client(clientId);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google credential' });
    }

    const { sub: googleId, email, name, picture } = payload;

    const db = getDB();
    const users = db.collection('users');

    let user = await users.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      const updates: any = {};
      if (!user.googleId) updates.googleId = googleId;
      if (name && name !== user.name) updates.name = name;
      if (picture && picture !== user.image) updates.image = picture;
      if (Object.keys(updates).length > 0) {
        await users.updateOne({ _id: user._id }, { $set: updates });
        user = await users.findOne({ _id: user._id });
      }
    } else {
      const newUser = {
        googleId,
        email,
        name: name || email.split('@')[0],
        image: picture || '',
        role: 'user' as const,
        location: '',
        phone: '',
        bio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await users.insertOne(newUser);
      user = await users.findOne({ _id: result.insertedId });
    }

    const token = jwt.sign({ userId: user!._id.toString() }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });

    res.json({
      token,
      user: {
        _id: user!._id.toString(),
        name: user!.name,
        email: user!.email,
        image: user!.image || '',
        location: user!.location || '',
        phone: user!.phone || '',
        bio: user!.bio || '',
        role: user!.role || 'user',
        createdAt: user!.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error?.message || error);
    res.status(500).json({ message: 'Google authentication failed', detail: error?.message || 'Unknown error' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      location: user.location,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, phone, location, bio, image } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1)) {
      return res.status(400).json({ message: 'Name must be a non-empty string' });
    }

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = (phone || '').trim();
    if (location !== undefined) updates.location = (location || '').trim();
    if (bio !== undefined) updates.bio = (bio || '').trim();
    if (image !== undefined) updates.image = (image || '').trim();

    const db = getDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: updates }
    );

    const updated = await db.collection('users').findOne({ _id: new ObjectId(user._id) });

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updated?._id.toString(),
        name: updated?.name,
        email: updated?.email,
        image: updated?.image || '',
        location: updated?.location || '',
        phone: updated?.phone || '',
        bio: updated?.bio || '',
        role: updated?.role || 'user',
        createdAt: updated?.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
