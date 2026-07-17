import { Request, Response } from 'express';
import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export const getAllCats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { location, gender, age, search } = req.query;

    const filter: any = { status: 'available' };

    if (location) filter.location = location;
    if (gender) filter.gender = gender;
    if (age) {
      const ageNum = parseInt(age as string);
      if (!isNaN(ageNum)) {
        filter.age = { $lte: ageNum };
      }
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const cats = await db.collection('cats')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(cats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
export const getCatById = async (req: Request, res: Response) => {};
export const createCat = async (req: Request, res: Response) => {};
export const updateCat = async (req: Request, res: Response) => {};
export const deleteCat = async (req: Request, res: Response) => {};
