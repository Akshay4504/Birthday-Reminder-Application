import { pool } from '../db/pool.js';
import { dueReminderType, turningAge, todayInZone } from '../utils/dates.js';
import { sendReminderEmail } from './emailService.js';

export const runReminders = async () => {
  const counts = { checked: 0, sent: 0, skipped: 0, failed: 0 };
  
  try {
    const [rows] = await pool.query(`
      SELECT b.id AS birthday_id, b.name, b.birth_date, 
             u.id AS user_id, u.email, u.timezone 
      FROM birthdays b
      JOIN users u ON b.user_id = u.id
      WHERE u.email_reminders_enabled = 1
    `);
    
    counts.checked = rows.length;
    
    for (const row of rows) {
      const todayISO = todayInZone(row.timezone || 'UTC');
      const reminderType = dueReminderType(row.birth_date, todayISO);
      
      if (reminderType === '7_day' || reminderType === '1_day') {
        const year = new Date(todayISO).getFullYear();
        
        try {
          const [insertResult] = await pool.query(
            'INSERT INTO reminder_log (birthday_id, reminder_type, occurrence_year) VALUES (?, ?, ?)',
            [row.birthday_id, reminderType, year]
          );
          
          try {
            const age = turningAge(row.birth_date, todayISO);
            await sendReminderEmail({
              to: row.email,
              name: row.name,
              birthDate: row.birth_date,
              turningAge: age,
              reminderType
            });
            counts.sent++;
          } catch (emailErr) {
            console.error(`Email failed for birthday ${row.birthday_id}:`, emailErr);
            counts.failed++;
            await pool.query('DELETE FROM reminder_log WHERE id = ?', [insertResult.insertId]);
          }
        } catch (dbErr) {
          if (dbErr.code === 'ER_DUP_ENTRY') {
            counts.skipped++;
          } else {
            console.error(`DB error for birthday ${row.birthday_id}:`, dbErr);
            counts.failed++;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching birthdays for reminders:', err);
  }
  
  return counts;
};
