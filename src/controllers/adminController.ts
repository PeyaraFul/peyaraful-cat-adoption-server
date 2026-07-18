import { Request, Response } from 'express';
import { getDB } from '../config/db';
import { ObjectId } from 'mongodb';

export const getStats = async (req: Request, res: Response) => {};
export const getAllUsers = async (req: Request, res: Response) => {};
export const deleteUser = async (req: Request, res: Response) => {};
export const getAllCats = async (req: Request, res: Response) => {};
export const deleteCat = async (req: Request, res: Response) => {};
export const getAllAdoptions = async (req: Request, res: Response) => {};
