import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runReminders } from '../src/services/reminderService.js';
import { pool } from '../src/db/pool.js';
import * as datesUtils from '../src/utils/dates.js';
import * as emailService from '../src/services/emailService.js';

vi.mock('../src/db/pool.js', () => ({
  pool: {
    query: vi.fn()
  }
}));

vi.mock('../src/services/emailService.js', () => ({
  sendReminderEmail: vi.fn()
}));

describe('Reminder Job duplicate protection and fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(datesUtils, 'dueReminderType').mockReturnValue('7_day');
    vi.spyOn(datesUtils, 'todayInZone').mockReturnValue('2023-10-15');
    vi.spyOn(datesUtils, 'turningAge').mockReturnValue(30);
  });

  it('sends email and logs when no duplicate exists', async () => {
    pool.query.mockResolvedValueOnce([[{
      birthday_id: 1, name: 'Alice', birth_date: '1993-10-22',
      user_id: 1, email: 'alice@example.com', timezone: 'UTC'
    }]]);
    
    pool.query.mockResolvedValueOnce([{ insertId: 100 }]);
    emailService.sendReminderEmail.mockResolvedValueOnce();

    const counts = await runReminders();
    
    expect(counts).toEqual({ checked: 1, sent: 1, skipped: 0, failed: 0 });
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(emailService.sendReminderEmail).toHaveBeenCalledTimes(1);
  });

  it('skips email when duplicate key error occurs', async () => {
    pool.query.mockResolvedValueOnce([[{
      birthday_id: 1, name: 'Alice', birth_date: '1993-10-22',
      user_id: 1, email: 'alice@example.com', timezone: 'UTC'
    }]]);
    
    const dupError = new Error('Duplicate');
    dupError.code = 'ER_DUP_ENTRY';
    pool.query.mockRejectedValueOnce(dupError);

    const counts = await runReminders();
    
    expect(counts).toEqual({ checked: 1, sent: 0, skipped: 1, failed: 0 });
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(emailService.sendReminderEmail).not.toHaveBeenCalled();
  });

  it('deletes the log row if email sending fails', async () => {
    pool.query.mockResolvedValueOnce([[{
      birthday_id: 1, name: 'Alice', birth_date: '1993-10-22',
      user_id: 1, email: 'alice@example.com', timezone: 'UTC'
    }]]);
    
    pool.query.mockResolvedValueOnce([{ insertId: 999 }]);
    emailService.sendReminderEmail.mockRejectedValueOnce(new Error('SMTP Error'));
    pool.query.mockResolvedValueOnce([]);

    const counts = await runReminders();
    
    expect(counts).toEqual({ checked: 1, sent: 0, skipped: 0, failed: 1 });
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenNthCalledWith(3, 'DELETE FROM reminder_log WHERE id = ?', [999]);
  });
});
