/* سرویس: ذخیره‌ساز + قفل بین‌تبی (Web Locks) + تولید. قفل فقط لایه‌ی کمکی است؛ تضمین نهایی یکتایی با قید یکتای IndexedDB است. */
import { IdbStore } from '../database/idb-store.js';
import { generateSerials } from '../generator/generator.js';

export async function openStore() { const s = new IdbStore(); await s.init(); return s; }

export function runExclusive(fn) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) return navigator.locks.request('pos-serial-generate', fn);
  return fn();   // بدون Web Locks: فقط قید یکتای پایگاه‌داده محافظ است (همان تضمین، ولی بدون سریال‌سازی)
}
export const locksAvailable = () => typeof navigator !== 'undefined' && !!navigator.locks?.request;
export function generate(opts) { return runExclusive(() => generateSerials(opts)); }
