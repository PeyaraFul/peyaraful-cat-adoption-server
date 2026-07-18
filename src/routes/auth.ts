import { Router, Request, Response } from 'express';
import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.get('/me', dummyAuth, async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const found = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
    if (!found) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: found._id,
      name: found.name,
      email: found.email,
      image: found.image || '',
      location: found.location || '',
      phone: found.phone || '',
      bio: found.bio || '',
      role: found.role || 'user',
      createdAt: found.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/profile', dummyAuth, async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const { name, phone, location, bio, image } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (location !== undefined) updates.location = location;
    if (bio !== undefined) updates.bio = bio;
    if (image !== undefined) updates.image = image;

    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      { $set: updates }
    );

    const updated = await db.collection('users').findOne({ _id: new ObjectId(user._id) });

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updated?._id,
        name: updated?.name,
        email: updated?.email,
        image: updated?.image || '',
        location: updated?.location || '',
        phone: updated?.phone || '',
        bio: updated?.bio || '',
        role: updated?.role || 'user',
        createdAt: updated?.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
