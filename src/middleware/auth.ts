import { Request, Response, NextFunction } from 'express';

// Dummy auth middleware - will be replaced with real JWT in Task 16
export const dummyAuth = (req: Request, res: Response, next: NextFunction) => {
  // Simulate a logged-in user
  (req as any).user = {
    _id: '6650f1a2b1234567890abcde',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };
  next();
};
