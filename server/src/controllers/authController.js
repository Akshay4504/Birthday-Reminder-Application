import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';

const authSchema = z.object({
  email: z.string().email().transform(str => str.toLowerCase().trim()),
  password: z.string().min(8)
});

export const signup = async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    try {
      await pool.query(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash]
      );
      res.status(201).json({ message: 'User created successfully' });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      throw dbError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors?.[0]?.message || 'Validation error' });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge
    });
    
    res.json({
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      emailRemindersEnabled: user.email_reminders_enabled
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors?.[0]?.message || 'Validation error' });
    }
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const me = (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    timezone: req.user.timezone,
    emailRemindersEnabled: req.user.email_reminders_enabled
  });
};
