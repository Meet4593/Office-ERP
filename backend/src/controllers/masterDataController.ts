import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMasterData = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { id: 'desc' } });
    const items = await prisma.item.findMany({ orderBy: { id: 'desc' } });
    const paymentModes = await prisma.paymentMode.findMany({ orderBy: { id: 'desc' } });
    const suppliers = await prisma.supplier.findMany({ orderBy: { id: 'desc' } });
    const customers = await prisma.customer.findMany({ orderBy: { id: 'desc' } });
    const machines = await prisma.machine.findMany({ orderBy: { id: 'desc' } });
    const units = await prisma.unit.findMany({ orderBy: { id: 'desc' } });

    res.json({
      departments,
      items,
      paymentModes,
      suppliers,
      customers,
      machines,
      units
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching master data' });
  }
};

const getModel = (type: string) => {
  const models: { [key: string]: any } = {
    departments: prisma.department,
    items: prisma.item,
    paymentmodes: prisma.paymentMode,
    suppliers: prisma.supplier,
    customers: prisma.customer,
    machines: prisma.machine,
    units: prisma.unit
  };
  return models[type.toLowerCase()];
};

export const addRecord = async (req: Request, res: Response) => {
  const type = req.params.type as string;
  const model = getModel(type);
  if (!model) return res.status(400).json({ message: `Invalid master data type: "${type}"` });

  try {
    const newRecord = await model.create({ data: req.body });
    res.status(201).json(newRecord);
  } catch (error: any) {
    console.error('Error adding record:', error);
    res.status(500).json({ message: error.message || 'Error adding record' });
  }
};

export const updateRecord = async (req: Request, res: Response) => {
  const type = req.params.type as string;
  const id = req.params.id as string;
  const model = getModel(type);
  if (!model) return res.status(400).json({ message: 'Invalid master data type' });

  try {
    const updatedRecord = await model.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Error updating record' });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  const type = req.params.type as string;
  const id = req.params.id as string;
  const model = getModel(type);
  if (!model) return res.status(400).json({ message: 'Invalid master data type' });

  try {
    await model.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Error deleting record (might be used elsewhere)' });
  }
};
