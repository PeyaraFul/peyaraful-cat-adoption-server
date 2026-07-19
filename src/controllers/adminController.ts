import { Request, Response } from 'express';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const getStats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const totalCats = await db.collection('cats').countDocuments();
    const totalUsers = await db.collection('users').countDocuments();
    const totalAdoptions = await db.collection('adoption_requests').countDocuments({ status: 'approved' });
    const pendingAdoptions = await db.collection('adoption_requests').countDocuments({ status: 'pending' });
    const rejectedAdoptions = await db.collection('adoption_requests').countDocuments({ status: 'rejected' });

    const catsByStatus = {
      available: await db.collection('cats').countDocuments({ status: 'available' }),
      pending: await db.collection('cats').countDocuments({ status: 'pending' }),
      adopted: await db.collection('cats').countDocuments({ status: 'adopted' })
    };

    const now = new Date();
    const catsPerMonth: { month: string; count: number }[] = [];
    const usersPerMonth: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });

      const catCount = await db.collection('cats').countDocuments({ createdAt: { $gte: start, $lte: end } });
      catsPerMonth.push({ month: label, count: catCount });

      const userCount = await db.collection('users').countDocuments({ createdAt: { $gte: start, $lte: end } });
      usersPerMonth.push({ month: label, count: userCount });
    }

    res.json({
      totalCats, totalUsers, totalAdoptions, pendingAdoptions, rejectedAdoptions,
      catsByStatus, catsPerMonth, usersPerMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const users = await db.collection('users')
      .find()
      .project({ googleId: 0 })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const admin = (req as any).user;
    const rawId: string | string[] = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (admin._id === id) {
      return res.status(400).json({ message: 'Admin cannot delete themselves' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.collection('users').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllCats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const cats = await db.collection('cats')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(cats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteCat = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const rawId: string | string[] = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid cat ID' });
    }

    const cat = await db.collection('cats').findOne({ _id: new ObjectId(id) });
    if (!cat) {
      return res.status(404).json({ message: 'Cat not found' });
    }

    await db.collection('cats').deleteOne({ _id: new ObjectId(id) });
    await db.collection('adoption_requests').deleteMany({ catId: id });

    res.json({ message: 'Cat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllAdoptions = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { status } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const adoptions = await db.collection('adoption_requests')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(adoptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
