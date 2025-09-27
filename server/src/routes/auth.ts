import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';

export const authRouter = Router();

// Auth middleware types
interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Require authentication middleware
const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// In-memory demo users for login (but we'll sync them to SQLite database)
const DEMO_USERS = [
  { id: '1', email: 'admin', password: 'admin123', name: 'Admin User', role: 'admin' as const },
  { id: '2', email: 'teacher', password: 'teacher123', name: 'Teacher Demo', role: 'teacher' as const },
  { id: '3', email: 'student', password: 'student123', name: 'Student Demo', role: 'student' as const }
];

// Ensure demo users exist in SQLite database
async function ensureDemoUsersInDB() {
  try {
    for (const demoUser of DEMO_USERS) {
      await prisma.user.upsert({
        where: { email: demoUser.email },
        update: {},
        create: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          passwordHash: demoUser.password, // Store plaintext for demo simplicity
          role: demoUser.role
        }
      });
    }
    console.log('Demo users synced to SQLite database');
  } catch (error) {
    console.log('Database not ready, using in-memory auth only');
  }
}

// Generate 8-digit user ID
function generateUserId(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Generate random password
function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Login endpoint - works with both demo users and database users
authRouter.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    await ensureDemoUsersInDB();
    console.log('Looking for user with username:', email);
    
    // Check database for user (includes both demo and created users)
    let user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    
    // If database fails, fallback to in-memory demo users
    if (!user) {
      console.log('User not found in database, checking in-memory demo users');
      const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      if (demoUser) {
        console.log('Found demo user:', demoUser.email);
        // Create JWT token for demo user
        const token = jwt.sign(
          { sub: demoUser.id, role: demoUser.role }, 
          process.env.JWT_SECRET || 'dev-secret-123',
          { expiresIn: '7d' }
        );
        
        return res.json({ 
          token, 
          user: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role
          }
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Simple password check (stored as plaintext for demo)
    if (user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { sub: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'dev-secret-123',
      { expiresIn: '7d' }
    );
    
    console.log('Login successful for:', user.email);
    res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin: Create new user (generates 8-digit ID and random password)
authRouter.post('/admin/create-user', async (req, res) => {
  try {
    const { name, role } = req.body;
    
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role required' });
    }
    
    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be teacher or student' });
    }
    
    const userId = generateUserId();
    const password = generatePassword();
    const email = userId; // Just use the 8-digit ID as username
    
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        passwordHash: password, // Storing plaintext for demo
        role
      }
    });
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      password // Return password so admin can share it
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Admin: Get all users
authRouter.get('/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Delete user
authRouter.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting demo admin
    if (id === '1') {
      return res.status(400).json({ error: 'Cannot delete demo admin' });
    }
    
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
