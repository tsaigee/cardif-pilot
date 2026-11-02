/**
 * 客服營業時間判斷（台北時間）
 * 依官網公告：週一至週五 9:00–20:00、週六 9:00–12:00。
 * 紀念日及連續假期（9:00–18:00）需人工維護假日表，原型未內建。
 */
import type { HandoffInfo } from '../shared/types';
import { CARDIF_HOTLINE, CARDIF_HOURS_TEXT } from '../shared/constants';

function taipeiParts(now: Date): { weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = Number(parts.hour) % 24;
  return { weekday: weekdayMap[parts.weekday], minutes: hour * 60 + Number(parts.minute) };
}

export function isServiceOpen(now: Date = new Date()): boolean {
  const { weekday, minutes } = taipeiParts(now);
  if (weekday >= 1 && weekday <= 5) return minutes >= 9 * 60 && minutes < 20 * 60;
  if (weekday === 6) return minutes >= 9 * 60 && minutes < 12 * 60;
  return false;
}

export function buildHandoff(recommended: boolean, reason: string, now: Date = new Date()): HandoffInfo {
  const open = isServiceOpen(now);
  return {
    recommended,
    isOpenNow: open,
    mode: open ? 'call' : 'callback',
    hotline: CARDIF_HOTLINE,
    hoursText: CARDIF_HOURS_TEXT,
    reason,
  };
}
