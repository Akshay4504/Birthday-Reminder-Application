import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { DateTime } from 'luxon';

const settingsSchema = z.object({
  timezone: z.string().refine(tz => DateTime.now().setZone(tz).isValid, "Invalid IANA timezone"),
  emailRemindersEnabled: z.boolean()
});

export const updateSettings = async (req, res, next) => {
  try {
    const data = settingsSchema.parse(req.body);
    
    await pool.query(
      'UPDATE users SET timezone = ?, email_reminders_enabled = ? WHERE id = ?',
      [data.timezone, data.emailRemindersEnabled, req.user.id]
    );
    
    res.json({
      timezone: data.timezone,
      emailRemindersEnabled: data.emailRemindersEnabled
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
    }
    next(err);
  }
};

const deleteSchema = z.object({
  password: z.string().min(1, "Password is required")
});

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = deleteSchema.parse(req.body);
    
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    
    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
    }
    next(err);
  }
};
