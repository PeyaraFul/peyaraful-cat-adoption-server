import { Request, Response } from 'express';
import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export const getStats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const totalCats = await db.collection('cats').countDocuments();
    const totalUsers = await db.collection('users').countDocuments();
    const totalAdoptions = await db.collection('adoption_requests').countDocuments({ status: 'approved' });

    res.json({ totalCats, totalUsers, totalAdoptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const users = await db.collection('users')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.collection('users').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
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
    res.status(500).json({ message: 'Server error', error });
  }
};
export const deleteCat = async (req: Request, res: Response) => {};
export const getAllAdoptions = async (req: Request, res: Response) => {};
