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
export const getTopStories = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const stories = await db.collection('stories')
      .find()
      .sort({ likes: -1 })
      .limit(3)
      .toArray();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export const createStory = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    const { catName, content, image } = req.body;

    if (!catName || !content) {
      return res.status(400).json({ message: 'Cat name and content are required' });
    }

    const newStory = {
      userId: user._id,
      userName: user.name,
      userImage: user.image || '',
      catName,
      content,
      image: image || '',
      likes: 0,
      createdAt: new Date()
    };

    const result = await db.collection('stories').insertOne(newStory);

    res.status(201).json({
      message: 'Story created successfully',
      story: { ...newStory, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export const deleteStory = async (req: Request, res: Response) => {};
