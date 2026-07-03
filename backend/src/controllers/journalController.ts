import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { date, description, details } = req.body;
    
    const srCount = await prisma.journal.count();
    const srNumber = `JRN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(srCount + 1).padStart(4, '0')}`;

    const journal = await prisma.journal.create({
      data: {
        srNumber,
        date: new Date(date),
        description,
        details: {
          create: details.map((d: any) => ({
            type: d.type,
            accountName: d.accountName,
            debit: d.debit ? parseFloat(d.debit) : null,
            credit: d.credit ? parseFloat(d.credit) : null,
          }))
        }
      },
      include: {
        details: true
      }
    });

    res.status(201).json(journal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating journal entry' });
  }
};

export const getJournals = async (req: Request, res: Response) => {
  try {
    const journals = await prisma.journal.findMany({
      include: { details: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(journals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching journal entries' });
  }
};

export const getJournalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const journal = await prisma.journal.findUnique({
      where: { id: parseInt(id as string) },
      include: { details: true }
    });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    res.json(journal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching journal entry' });
  }
};

export const updateJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, description, details } = req.body;

    const journalId = parseInt(id as string);

    // Delete existing details
    await prisma.journalDetail.deleteMany({
      where: { journalId }
    });

    // Update journal and create new details
    const journal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        date: date ? new Date(date) : undefined,
        description,
        details: {
          create: details.map((d: any) => ({
            type: d.type,
            accountName: d.accountName,
            debit: d.debit ? parseFloat(d.debit) : null,
            credit: d.credit ? parseFloat(d.credit) : null,
          }))
        }
      },
      include: { details: true }
    });

    res.json(journal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating journal entry' });
  }
};

export const deleteJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const masterPassword = process.env.DELETE_PASSWORD || 'admin123';
    
    if (password !== masterPassword) {
      return res.status(401).json({ message: 'Invalid password for deletion' });
    }

    await prisma.journal.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting journal entry' });
  }
};
