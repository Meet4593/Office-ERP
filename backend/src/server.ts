import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import transactionRoutes from './routes/transactionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import journalRoutes from './routes/journalRoutes';
import voucherRoutes from './routes/voucherRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly' });
});

import bcrypt from 'bcrypt';
import prisma from './utils/prisma';

const seedAdmin = async () => {
  try {
    const email = 'meet17727@gmail.com';
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      const password = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          name: 'Meet',
          email,
          password,
          role: 'ADMIN'
        }
      });
      console.log('Seeded permanent admin user: meet17727@gmail.com');
    }
  } catch (error) {
    console.error('Failed to seed admin:', error);
  }
};

app.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Server is running on port ${PORT}`);
});
