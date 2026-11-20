/* لایه‌ی اعتبارسنجی مستقل: هر سریال با همان منطق پورت‌شده‌ی پچ بررسی می‌شود.
   وضعیت‌ها: VALID, INVALID, DUPLICATE, BRAND_MISMATCH, MODEL_MISMATCH, UNSUPPORTED_RULE, GENERATION_EXHAUSTED */
import { detect, trimVba } from '../core/vba.js';
import { findCombo } from '../rules/registry.js';

export const VSTATUS_FA = {
  VALID: 'معتبر', INVALID: 'نامعتبر', DUPLICATE: 'تکراری', BRAND_MISMATCH: 'ناهمخوانی برند', MODEL_MISMATCH: 'ناهمخوانی مدل',
  UNSUPPORTED_RULE: 'قاعده‌ی پشتیبانی‌نشده', GENERATION_EXHAUSTED: 'فضای تولید تمام شد'
};
export const DUP_FA = { NONE: 'یکتا', BATCH: 'تکراری در همین دسته', HISTORY: 'تکراری در تاریخچه', EXCLUSION: 'در فهرست استثنا' };

/** سریال را با پچ می‌سنجد. ctx.dup: 'NONE' | 'BATCH' | 'HISTORY' | 'EXCLUSION' (نتیجه‌ی بررسی یکتایی، جداگانه محاسبه می‌شود) */
export function validate(serial, brand, model, ctx = {}) {
  const checks = [];
  const raw = String(serial);
  const s = trimVba(raw);
  const base = { serial: s, length: s.length, prefix: s.substring(0, 4) };
  if (!s) return { ...base, status: 'INVALID', explanation: 'سریال خالی است.', checks };
  if (/[\u0000-\u001f\u007f]/.test(s)) return { ...base, status: 'INVALID', explanation: 'سریال نویسه‌ی کنترلی دارد و برای پچ معتبر نیست.', checks };
  const combo = findCombo(brand, model);
  if (!combo) return { ...base, status: 'UNSUPPORTED_RULE', explanation: `ترکیب «${brand} / ${model}» در پچ تأیید نشده است و تولید یا تأیید آن مسدود است.`, checks };
  const okLen = combo.templates.some(t => t.length === s.length);
  checks.push({ name: 'طول', ok: okLen });
  if (!okLen) return { ...base, status: 'INVALID', explanation: `طول ${s.length} برای ${brand} / ${model} در پچ تعریف نشده است (طول‌های مجاز: ${[...new Set(combo.templates.map(t => t.length))].join('، ')}).`, checks };
  const okPrefix = combo.templates.some(t => t.length === s.length && s.startsWith(t.prefix));
  checks.push({ name: 'پیشوند', ok: okPrefix });
  if (!okPrefix) return { ...base, status: 'INVALID', explanation: 'پیشوند سریال با هیچ الگوی تأییدشده‌ی این ترکیب نمی‌خواند.', checks };
  const d = detect(s);
  // ترکیب اعلام‌شده توسط کاربر: پچ باید مدل را بدهد و برند را «نشناسد»؛ برند را اعلام کاربر تأمین می‌کند
  const wantBrand = combo.userDeclared ? null : brand, gotBrand = d.brand ?? null;
  checks.push({ name: combo.userDeclared ? 'برند (اعلام کاربر؛ پچ برند ندارد)' : 'برند پچ', ok: gotBrand === wantBrand }, { name: 'مدل پچ', ok: d.model === model });
  if (gotBrand !== wantBrand) return { ...base, status: 'BRAND_MISMATCH', detected: d, explanation: `پچ برند «${d.brand ?? 'نامشخص'}» را تشخیص می‌دهد، نه «${brand}».`, checks };
  if (d.model !== model) return { ...base, status: 'MODEL_MISMATCH', detected: d, explanation: `پچ مدل «${d.model || 'نامشخص'}» را تشخیص می‌دهد، نه «${model}».`, checks };
  if (ctx.dup && ctx.dup !== 'NONE') return { ...base, status: 'DUPLICATE', detected: d, explanation: DUP_FA[ctx.dup] + '؛ این سریال پذیرفته نمی‌شود.', checks };
  return { ...base, status: 'VALID', detected: d, explanation: combo.userDeclared ? `طول و پیشوند و مدل مطابق پچ تأیید شد؛ برند «${brand}» اعلام کاربر است، نه پچ.` : 'طول، پیشوند، برند و مدل مطابق پچ تأیید شد.', source: combo.source, checks };
}
