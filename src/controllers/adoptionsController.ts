import { Request, Response } from 'express';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const createAdoption = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const { catId, message } = req.body;

    if (!catId) {
      return res.status(400).json({ message: 'Cat ID is required' });
    }

    if (!ObjectId.isValid(catId)) {
      return res.status(400).json({ message: 'Invalid cat ID' });
    }

    const cat = await db.collection('cats').findOne({ _id: new ObjectId(catId) });
    if (!cat) {
      return res.status(404).json({ message: 'Cat not found' });
    }

    if (cat.ownerId === user._id) {
      return res.status(400).json({ message: 'You cannot adopt your own cat' });
    }

    const existing = await db.collection('adoption_requests').findOne({
      catId, requesterId: user._id, status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request for this cat' });
    }

    let ownerName = '';
    let ownerEmail = '';
    if (cat.ownerId) {
      const owner = await db.collection('users').findOne({ _id: new ObjectId(cat.ownerId) });
      if (owner) {
        ownerName = owner.name || '';
        ownerEmail = owner.email || '';
      }
    }

    const newRequest = {
      catId,
      catName: cat.name,
      catPhoto: cat.photo,
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ownerId: cat.ownerId,
      ownerName,
      ownerEmail,
      status: 'pending',
      message: message || '',
      createdAt: new Date()
    };

    const result = await db.collection('adoption_requests').insertOne(newRequest);

    res.status(201).json({
      message: 'Adoption request sent successfully',
      request: { ...newRequest, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const getReceivedRequests = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;

    const requests = await db.collection('adoption_requests')
      .find({ ownerId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const getSentRequests = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;

    const requests = await db.collection('adoption_requests')
      .find({ requesterId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const rawId: string | string[] = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const updated = await db.collection('adoption_requests').findOneAndUpdate(
      { _id: new ObjectId(id), ownerId: user._id, status: 'pending' },
      { $set: { status: 'approved', updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    await db.collection('cats').updateOne(
      { _id: new ObjectId(updated.catId) },
      { $set: { status: 'adopted', updatedAt: new Date() } }
    );

    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const rawId2: string | string[] = req.params.id;
    const id = Array.isArray(rawId2) ? rawId2[0] : rawId2;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const updated = await db.collection('adoption_requests').findOneAndUpdate(
      { _id: new ObjectId(id), ownerId: user._id, status: 'pending' },
      { $set: { status: 'rejected', updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
