import { Request, Response } from 'express';
import { getDB } from '../config/db';
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

    const newRequest = {
      catId,
      catName: cat.name,
      catPhoto: cat.photo,
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ownerId: cat.ownerId,
      ownerName: cat.ownerName || '',
      ownerEmail: cat.ownerEmail || '',
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
    res.status(500).json({ message: 'Server error', error });
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
    res.status(500).json({ message: 'Server error', error });
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
    res.status(500).json({ message: 'Server error', error });
  }
};
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const id: string = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const request = await db.collection('adoption_requests').findOne({ _id: new ObjectId(id) });
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.ownerId !== user._id) {
      return res.status(403).json({ message: 'Only the cat owner can approve requests' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    await db.collection('adoption_requests').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );

    await db.collection('cats').updateOne(
      { _id: new ObjectId(request.catId) },
      { $set: { status: 'adopted', updatedAt: new Date() } }
    );

    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export const rejectRequest = async (req: Request, res: Response) => {};
