import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_please_change';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    department?: string | null;
    permissions?: string[];
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded as { userId: number; role: string; department?: string | null; permissions?: string[] };
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Require Admin role' });
  }
  next();
};

export const requirePermission = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'ADMIN') {
      return next(); // ADMIN can do anything
    }
    const perms = req.user?.permissions || [];
    if (!perms.includes(action)) {
      return res.status(403).json({ message: `Require ${action} permission` });
    }
    next();
  };
};
