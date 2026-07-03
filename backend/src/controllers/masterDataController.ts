import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMasterData = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany();
    const items = await prisma.item.findMany();
    const paymentModes = await prisma.paymentMode.findMany();

    res.json({
      departments,
      items,
      paymentModes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching master data' });
  }
};
