import { Request, Response } from 'express';
import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export const getAllStories = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const stories = await db.collection('stories')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export const getTopStories = async (req: Request, res: Response) => {};
export const createStory = async (req: Request, res: Response) => {};
export const deleteStory = async (req: Request, res: Response) => {};
