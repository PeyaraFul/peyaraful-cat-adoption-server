import { Request, Response } from 'express';
import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export const createAdoption = async (req: Request, res: Response) => {};
export const getReceivedRequests = async (req: Request, res: Response) => {};
export const getSentRequests = async (req: Request, res: Response) => {};
export const approveRequest = async (req: Request, res: Response) => {};
export const rejectRequest = async (req: Request, res: Response) => {};
