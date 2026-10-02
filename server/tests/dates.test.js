import { describe, it, expect, vi } from 'vitest';
import { nextOccurrence, daysUntil, turningAge, todayInZone, dueReminderType } from '../src/utils/dates.js';

describe('Date Utilities', () => {
  it('birthday today', () => {
    expect(nextOccurrence('1990-05-10', '2023-05-10')).toBe('2023-05-10');
    expect(daysUntil('1990-05-10', '2023-05-10')).toBe(0);
    expect(turningAge('1990-05-10', '2023-05-10')).toBe(33);
  });

  it('birthday yesterday', () => {
    expect(nextOccurrence('1990-05-10', '2023-05-11')).toBe('2024-05-10');
    expect(daysUntil('1990-05-10', '2023-05-11')).toBe(365);
    expect(turningAge('1990-05-10', '2023-05-11')).toBe(34);
  });

  it('birthday tomorrow', () => {
    expect(nextOccurrence('1990-05-10', '2023-05-09')).toBe('2023-05-10');
    expect(daysUntil('1990-05-10', '2023-05-09')).toBe(1);
    expect(dueReminderType('1990-05-10', '2023-05-09')).toBe('1_day');
  });

  it('exactly 7 days away', () => {
    expect(daysUntil('1990-05-10', '2023-05-03')).toBe(7);
    expect(dueReminderType('1990-05-10', '2023-05-03')).toBe('7_day');
  });

  it('year rollover (Dec 28 to Jan 4)', () => {
    expect(nextOccurrence('1990-01-04', '2023-12-28')).toBe('2024-01-04');
    expect(daysUntil('1990-01-04', '2023-12-28')).toBe(7);
    expect(dueReminderType('1990-01-04', '2023-12-28')).toBe('7_day');
  });

  it('Feb 29 in non-leap years', () => {
    expect(nextOccurrence('2000-02-29', '2023-01-01')).toBe('2023-02-28');
    expect(turningAge('2000-02-29', '2023-01-01')).toBe(23);
  });

  it('Feb 29 in leap years', () => {
    expect(nextOccurrence('2000-02-29', '2024-01-01')).toBe('2024-02-29');
    expect(turningAge('2000-02-29', '2024-01-01')).toBe(24);
  });

  it('timezone boundary case for todayInZone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-05-10T00:00:00Z'));
    
    expect(todayInZone('UTC')).toBe('2023-05-10');
    expect(todayInZone('America/New_York')).toBe('2023-05-09');
    expect(todayInZone('Asia/Tokyo')).toBe('2023-05-10');
    
    vi.useRealTimers();
  });
});
