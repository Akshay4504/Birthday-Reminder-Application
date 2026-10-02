import { z } from 'zod';
import { pool } from '../db/pool.js';
import { generateBirthdayMessage } from '../services/aiService.js';
import { turningAge, todayInZone } from '../utils/dates.js';

const aiMessageSchema = z.object({
  birthdayId: z.coerce.number().int(),
  mode: z.enum(['draft', 'edit']),
  tone: z.enum(['heartfelt', 'funny', 'formal', 'short']),
  userText: z.string().max(1000).optional()
}).refine(data => {
  if (data.mode === 'edit' && (!data.userText || data.userText.trim() === '')) {
    return false;
  }
  return true;
}, { message: "userText is required when mode is 'edit'", path: ["userText"] });

export const generateMessage = async (req, res, next) => {
  try {
    const data = aiMessageSchema.parse(req.body);

    const [rows] = await pool.query('SELECT * FROM birthdays WHERE id = ? AND user_id = ?', [data.birthdayId, req.user.id]);
    const b = rows[0];
    if (!b) {
      return res.status(404).json({ error: 'Birthday not found' });
    }

    const todayISO = todayInZone(req.user.timezone || 'UTC');
    const age = turningAge(b.birth_date, todayISO);

    const message = await generateBirthdayMessage({
      name: b.name,
      relationship: b.relationship,
      notes: b.notes,
      turningAge: age,
      mode: data.mode,
      tone: data.tone,
      userText: data.userText
    });

    res.json({ message });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('Zod Error in AI Controller:', err.errors);
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
    }
    console.error('AI Error:', err);
    if (err?.error?.error?.message) {
      return res.status(503).json({ error: err.error.error.message });
    }
    if (err?.message) {
      return res.status(503).json({ error: err.message });
    }
    res.status(503).json({ error: 'AI Service is currently unavailable or timed out. Please try again.' });
  }
};
