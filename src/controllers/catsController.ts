import { Request, Response } from 'express';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getAllCats = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { location, gender, age, search, page, limit } = req.query;

    const filter: any = { status: 'available' };

    if (location) filter.location = location;
    if (gender) filter.gender = gender;
    if (age) {
      const ageNum = parseInt(age as string, 10);
      if (!isNaN(ageNum)) {
        filter.age = { $lte: ageNum };
      }
    }
    if (search) {
      const safe = escapeRegex(search as string);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { breed: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [cats, total] = await Promise.all([
      db.collection('cats')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection('cats').countDocuments(filter)
    ]);

    res.json({ cats, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const getCatById = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    let { id } = req.params as { id?: string | string[] };
    if (Array.isArray(id)) id = id[0];

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid cat ID' });
    }

    const cat = await db.collection('cats').findOne({ _id: new ObjectId(id) });

    if (!cat) {
      return res.status(404).json({ message: 'Cat not found' });
    }

    res.json(cat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const createCat = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;

    const {
      name, age, breed, photo, description, location,
      gender, healthStatus, vaccinationStatus, temperament
    } = req.body;

    if (!name || !age || !breed || !photo || !location) {
      return res.status(400).json({ message: 'Name, age, breed, photo, and location are required' });
    }

    if (typeof name !== 'string' || name.trim().length < 1) {
      return res.status(400).json({ message: 'Name must be a non-empty string' });
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0) {
      return res.status(400).json({ message: 'Age must be a valid positive number' });
    }

    if (gender && !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Gender must be male or female' });
    }

    const newCat = {
      ownerId: user._id,
      name: name.trim(),
      age: ageNum,
      breed: breed.trim(),
      photo: photo.trim(),
      description: (description || '').trim(),
      location: location.trim(),
      gender: gender || 'male',
      healthStatus: healthStatus || 'Healthy',
      vaccinationStatus: vaccinationStatus || 'Not vaccinated',
      temperament: temperament || '',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('cats').insertOne(newCat);

    res.status(201).json({
      message: 'Cat listing created successfully',
      cat: { ...newCat, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateCat = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    let { id } = req.params as { id?: string | string[] };
    if (Array.isArray(id)) id = id[0];

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid cat ID' });
    }

    const cat = await db.collection('cats').findOne({ _id: new ObjectId(id) });

    if (!cat) {
      return res.status(404).json({ message: 'Cat not found' });
    }

    if (cat.ownerId !== user._id) {
      return res.status(403).json({ message: 'You can only update your own cat listings' });
    }

    const allowed = ['name', 'age', 'breed', 'photo', 'description', 'location', 'gender', 'healthStatus', 'vaccinationStatus', 'temperament'];
    const updates: any = { updatedAt: new Date() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
    }

    await db.collection('cats').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    res.json({ message: 'Cat updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteCat = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const user = (req as any).user;
    let { id } = req.params as { id?: string | string[] };
    if (Array.isArray(id)) id = id[0];

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid cat ID' });
    }

    const cat = await db.collection('cats').findOne({ _id: new ObjectId(id) });

    if (!cat) {
      return res.status(404).json({ message: 'Cat not found' });
    }

    if (cat.ownerId !== user._id && user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own cat listings' });
    }

    await db.collection('cats').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Cat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
