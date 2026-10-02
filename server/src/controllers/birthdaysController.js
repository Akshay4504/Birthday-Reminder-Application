import { z } from 'zod';
import { pool } from '../db/pool.js';
import { nextOccurrence, daysUntil, turningAge, todayInZone } from '../utils/dates.js';

const birthdaySchema = z.object({
  name: z.string().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").refine((dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return d <= sixMonthsFromNow;
  }, "Invalid date or too far in the future (max 6 months)"),
  relationship: z.enum(['friend', 'family', 'partner', 'colleague', 'other']),
  notes: z.string().max(500).optional()
});

export const getBirthdays = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const timezone = req.user.timezone || 'UTC';
    const [rows] = await pool.query('SELECT * FROM birthdays WHERE user_id = ?', [userId]);

    const todayISO = todayInZone(timezone);

    const enriched = rows.map(b => {
      const bDate = b.birth_date;
      return {
        ...b,
        nextDate: nextOccurrence(bDate, todayISO),
        daysUntil: daysUntil(bDate, todayISO),
        turningAge: turningAge(bDate, todayISO)
      };
    });

    enriched.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

export const createBirthday = async (req, res, next) => {
  try {
    const data = birthdaySchema.parse(req.body);
    const [result] = await pool.query(
      'INSERT INTO birthdays (user_id, name, birth_date, relationship, notes) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, data.name, data.birthDate, data.relationship, data.notes || null]
    );

    const [newRows] = await pool.query('SELECT * FROM birthdays WHERE id = ? AND user_id = ?', [result.insertId, req.user.id]);
    res.status(201).json(newRows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
    }
    next(err);
  }
};

export const updateBirthday = async (req, res, next) => {
  try {
    const data = birthdaySchema.parse(req.body);
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE birthdays SET name = ?, birth_date = ?, relationship = ?, notes = ? WHERE id = ? AND user_id = ?',
      [data.name, data.birthDate, data.relationship, data.notes || null, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Birthday not found' });
    }

    const [updatedRows] = await pool.query('SELECT * FROM birthdays WHERE id = ?', [id]);
    res.json(updatedRows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
    }
    next(err);
  }
};

export const deleteBirthday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM birthdays WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Birthday not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};
