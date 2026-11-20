/* تحلیل‌های خالص (بدون DOM) برای نمودارها؛ همه قابل تست‌اند. */
import { hamming } from '../generator/diversity.js';

/** ماتریس «جایگاه × نویسه» برای بخش متغیر: شمار هر نویسه در هر جایگاه */
export function positionMatrix(serials, prefixLen, chars) {
  if (!serials.length) return { rows: [], chars, max: 0 };
  const n = serials[0].length - prefixLen, idx = new Map([...chars].map((c, i) => [c, i]));
  const rows = Array.from({ length: n }, () => new Array(chars.length).fill(0));
  for (const s of serials) for (let p = 0; p < n; p++) { const i = idx.get(s[prefixLen + p]); if (i !== undefined) rows[p][i]++; }
  return { rows, chars, max: Math.max(1, ...rows.flat()), expected: serials.length / chars.length };
}
/** نمونه‌ی قطعی و یکنواخت از آرایه */
export function sample(arr, k) { if (arr.length <= k) return arr.slice(); const out = [], step = arr.length / k; for (let i = 0; i < k; i++) out.push(arr[Math.floor(i * step)]); return out; }
/** توزیع «فاصله‌ی همینگ تا نزدیک‌ترین سریال» برای نمونه‌ای از A در برابر مجموعه‌ی B (هم‌طول‌ها).
    same=true یعنی B همان A است (خود سریال کنار گذاشته می‌شود). نمونه‌گیری برای سرعت؛ ادعای آماری نیست، فقط نمای تقریبی. */
export function nearestDistanceHistogram(A, B, { sampleA = 250, sampleB = 4000, same = false } = {}) {
  const a = sample(A, sampleA), b = sample(B, sampleB), hist = {}; let min = Infinity, cnt = 0;
  for (const x of a) {
    let best = Infinity;
    for (const y of b) { if (same && x === y) continue; if (x.length !== y.length) continue; const d = hamming(x, y); if (d < best) best = d; if (best <= 1) break; }
    if (best === Infinity) continue; hist[best] = (hist[best] || 0) + 1; cnt++; if (best < min) min = best;
  }
  return { hist, min: cnt ? min : null, n: cnt, approximate: A.length > sampleA || B.length > sampleB };
}
/** خلاصه‌ی پارت‌ها از رکورد job ها */
export function partRows(jobs) {
  return jobs.filter(j => j.status === 'done' && j.partId).sort((a, b) => a.startedAt - b.startedAt);
}
/** ظرفیت مصرف‌شده: سریال‌های ذخیره‌شده تقسیم بر ظرفیت نظری (برای الفبای انتخابی) */
export function usedShare(count, capacity) { return capacity > 0 ? count / capacity : 0; }
