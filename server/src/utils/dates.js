import { DateTime } from 'luxon';

function getOccurrenceForYear(bDate, year) {
  const isLeapYear = DateTime.utc(year).isInLeapYear;
  if (bDate.month === 2 && bDate.day === 29 && !isLeapYear) {
    return DateTime.utc(year, 2, 28);
  }
  return DateTime.utc(year, bDate.month, bDate.day);
}

export function nextOccurrence(birthDate, todayISO) {
  let bDateStr = birthDate;
  if (birthDate instanceof Date) {
    bDateStr = birthDate.toISOString().split('T')[0];
  }
  const bDate = DateTime.fromISO(bDateStr, { zone: 'utc' });
  const today = DateTime.fromISO(todayISO, { zone: 'utc' });
  
  let targetYear = today.year;
  let occurrence = getOccurrenceForYear(bDate, targetYear);
  
  if (occurrence < today) {
    targetYear += 1;
    occurrence = getOccurrenceForYear(bDate, targetYear);
  }
  
  return occurrence.toISODate();
}

export function daysUntil(birthDate, todayISO) {
  const nextOcc = DateTime.fromISO(nextOccurrence(birthDate, todayISO), { zone: 'utc' });
  const today = DateTime.fromISO(todayISO, { zone: 'utc' });
  return nextOcc.diff(today, 'days').days;
}

export function turningAge(birthDate, todayISO) {
  let bDateStr = birthDate;
  if (birthDate instanceof Date) {
    bDateStr = birthDate.toISOString().split('T')[0];
  }
  const bDate = DateTime.fromISO(bDateStr, { zone: 'utc' });
  const nextOcc = DateTime.fromISO(nextOccurrence(birthDate, todayISO), { zone: 'utc' });
  return nextOcc.year - bDate.year;
}

export function todayInZone(timezone) {
  return DateTime.now().setZone(timezone).toISODate();
}

export function dueReminderType(birthDate, todayISO) {
  const diff = daysUntil(birthDate, todayISO);
  if (diff === 7) return '7_day';
  if (diff === 1) return '1_day';
  return null;
}
