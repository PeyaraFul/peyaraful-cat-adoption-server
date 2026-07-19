import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export interface JwtPayload {
  userId: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in environment variables');
  return secret;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    (req as any).user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || '',
      role: user.role || 'user',
      location: user.location || '',
      phone: user.phone || '',
      bio: user.bio || '',
      createdAt: user.createdAt,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  await authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};
