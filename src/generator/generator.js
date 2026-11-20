/* موتور تولید «داده‌ی آزمایشی منطبق با پچ».
   مرز ادعا: پچ فقط «تشخیص» است (طول + ۲ تا ۴ نویسه‌ی اول). بخش متغیر سریال در پچ تعریف نشده است؛
   انتخاب الفبای آن «تصمیم مهندسی خارج از پچ» است و صریحاً از کاربر گرفته می‌شود. هیچ سریالی «تولید رسمی» نیست.
   جریان: انتخاب الگوی تأییدشده ← ساخت کاندید ← اعتبارسنجی با پچ ← حذف تکراری دسته ← رزرو اتمیک در رجیستری (شامل تاریخچه و استثناها) ← تأیید یا بازگردانی کامل. */
import { findCombo, capacity } from '../rules/registry.js';
import { validate } from '../validator/validator.js';
import { DiversityIndex } from './diversity.js';

export const ALPHABETS = {
  digits: { id: 'digits', label: 'فقط ارقام ۰ تا ۹', chars: '0123456789' },
  alnum: { id: 'alnum', label: 'ارقام و حروف بزرگ A تا Z', chars: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' }
};
export const DIVERSITY_LEVELS = [{ id: 1, label: 'فقط یکتا (حداقل یک نویسه فرق)' }, { id: 2, label: 'متفاوت: دست‌کم ۲ نویسه فرق با هر سریال قبلی' }, { id: 3, label: 'کاملاً متفاوت: دست‌کم ۳ نویسه فرق با هر سریال قبلی (پیشنهادی)' }];
export const partId = (model, n) => `${model}-P${String(n).padStart(3, '0')}`;
export const LIMITS = { maxQuantity: 100000, chunk: 1000, attemptFactor: 20, attemptBase: 2000 };

export class GenerationError extends Error { constructor(code, message, detail = {}) { super(message); this.code = code; this.detail = detail; } }

export function cryptoRng() {
  const buf = new Uint32Array(1024); let i = buf.length;
  return n => { // عدد صحیح یکنواخت در [0,n) با رد کردن مقادیر سرریز (بدون bias)
    const limit = Math.floor(0x100000000 / n) * n;
    for (;;) { if (i >= buf.length) { globalThis.crypto.getRandomValues(buf); i = 0; } const v = buf[i++]; if (v < limit) return v % n; }
  };
}
export function seededRng(seed) { // فقط برای تست قطعی
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return n => Math.floor(f() * n);
}
const tick = () => new Promise(r => setTimeout(r, 0));
const newId = () => 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

/**
 * @param {object} o {brand, model, quantity, alphabet, store, rng?, signal?, onProgress?, jobId?}
 * @returns {Promise<{job, records}>} یا GenerationError (با بازگردانی کامل رزروها)
 */
export async function generateSerials(o) {
  const { brand, model, store, signal, onProgress } = o;
  const rng = o.rng || cryptoRng(), jobId = o.jobId || newId();
  const alpha = ALPHABETS[o.alphabet || 'digits'];
  const quantity = Number(o.quantity);
  const t0 = Date.now();
  if (!alpha) throw new GenerationError('INVALID_INPUT', 'الفبای بخش متغیر نامعتبر است.');
  if (!Number.isInteger(quantity) || quantity < 1) throw new GenerationError('INVALID_INPUT', 'تعداد باید عدد صحیح و حداقل ۱ باشد.');
  if (quantity > LIMITS.maxQuantity) throw new GenerationError('QUANTITY_LIMIT', `حداکثر تعداد در هر تولید ${LIMITS.maxQuantity} است.`);
  const combo = findCombo(brand, model);
  if (!combo) throw new GenerationError('UNSUPPORTED_RULE', `ترکیب «${brand} / ${model}» در پچ تأیید نشده است.`);
  if (!store || store.kind === 'memory-unsafe') throw new GenerationError('NO_PERSISTENCE', 'ذخیره‌ساز پایدار در دسترس نیست؛ بدون آن تضمین یکتایی ممکن نیست.');
  const cap = capacity(combo, alpha.chars.length);
  if (quantity > cap) throw new GenerationError('GENERATION_EXHAUSTED', `فضای نظری این ترکیب با الفبای انتخابی ${cap.toLocaleString('en')} سریال است؛ تعداد خواسته‌شده بیشتر است.`, { capacity: cap });

  const weights = combo.templates.map(t => Math.pow(alpha.chars.length, t.length - t.prefix.length));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const pickTemplate = () => { if (combo.templates.length === 1) return combo.templates[0]; let x = (rng(1000000000) / 1000000000) * wsum; for (let i = 0; i < weights.length; i++) { if ((x -= weights[i]) < 0) return combo.templates[i]; } return combo.templates[combo.templates.length - 1]; };

  const minDistance = [1, 2, 3].includes(Number(o.minDistance)) ? Number(o.minDistance) : 3;
  const stats = { attempts: 0, rejectedSimilar: 0, rejectedValidation: 0, rejectedBatchDup: 0, collisionsHistory: 0, collisionsExclusion: 0, byReason: {} };
  const maxAttempts = quantity * LIMITS.attemptFactor + LIMITS.attemptBase;
  // شماره‌ی پارت: ترتیبی برای هر (برند، مدل)؛ تولیدهای ناموفق شماره مصرف نمی‌کنند
  const prior = (await store.jobs_()).filter(j => j.brand === brand && j.model === model && j.status === 'done' && j.part);
  const part = prior.reduce((m, j) => Math.max(m, j.part), 0) + 1, pid = partId(model, part);
  // شاخص تفاوت از تاریخچه‌ی همین ترکیب ساخته می‌شود، هر الگو جدا (طول و پیشوند متفاوت = هرگز شبیه نیست)
  const idx = new Map(), indexOf = t => { let x = idx.get(t.id); if (!x) { x = new DiversityIndex(t.length - t.prefix.length, minDistance, 4096); idx.set(t.id, x); } return x; };
  const history = (await store.all()).filter(r => r.brand === brand && r.model === model);
  for (const r of history) { const t = combo.templates.find(x => x.id === r.ruleId); if (t && r.serial.length === t.length) indexOf(t).add(r.serial.slice(t.prefix.length)); }
  const job = { id: jobId, part, partId: pid, minDistance, historyCount: history.length, brand, model, quantity, alphabet: alpha.id, classification: 'TEST_DATA', uniquenessScope: 'LOCAL_REGISTRY', ruleSource: combo.source, startedAt: t0, status: 'running', stats };
  await store.putJob(job);
  const batch = new Set(), records = [];
  const bump = (k) => { stats.byReason[k] = (stats.byReason[k] || 0) + 1; };
  const fail = async (code, msg) => {
    await store.rollbackJob(jobId);
    Object.assign(job, { part: null, partId: null, status: code === 'CANCELLED' ? 'cancelled' : 'failed', error: code, message: msg, finishedAt: Date.now(), generated: 0 });
    await store.putJob(job); await store.addAudit({ jobId, action: 'generation-' + job.status, detail: { code, msg, stats } });
    throw new GenerationError(code, msg, { job });
  };
  await store.addAudit({ jobId, action: 'generation-start', detail: { brand, model, quantity, alphabet: alpha.id } });

  try {
    while (records.length < quantity) {
      if (signal?.aborted) return await fail('CANCELLED', 'تولید توسط کاربر لغو شد؛ همه‌ی رزروها بازگردانده شد.');
      const want = Math.min(LIMITS.chunk, quantity - records.length), pending = [];
      while (pending.length < want) {
        if (stats.attempts >= maxAttempts) return await fail('GENERATION_EXHAUSTED', `پس از ${stats.attempts} تلاش (سقف مجاز) فقط ${records.length + pending.length} سریال یکتا ساخته شد؛ فضای کاندید تقریباً پر است. هیچ سریالی ذخیره نشد.`);
        stats.attempts++;
        const t = pickTemplate();
        let s = t.prefix; for (let i = 0; i < t.length - t.prefix.length; i++) s += alpha.chars[rng(alpha.chars.length)];
        const v = validate(s, brand, model);
        if (v.status !== 'VALID') { stats.rejectedValidation++; bump(v.status); continue; }
        if (batch.has(s)) { stats.rejectedBatchDup++; bump('DUPLICATE_BATCH'); continue; }
        const vp = s.slice(t.prefix.length), ix = indexOf(t);
        if (ix.tooClose(vp)) { stats.rejectedSimilar++; bump('TOO_SIMILAR'); continue; }
        ix.add(vp);
        batch.add(s); pending.push({ part, partId: pid, minDistance, ruleSource: combo.source, serial: s, brand, model, ruleId: t.id, jobId, createdAt: Date.now(), validation: 'VALID', classification: 'TEST_DATA', uniquenessScope: 'LOCAL_REGISTRY', length: s.length, prefix: t.prefix });
      }
      const res = await store.reserveMany(pending);
      const bad = new Set(res.collisions.map(c => c.serial));
      for (const c of res.collisions) { c.reason === 'EXCLUSION' ? stats.collisionsExclusion++ : stats.collisionsHistory++; bump('COLLISION_' + c.reason); batch.delete(c.serial); }
      for (const p of pending) if (!bad.has(p.serial)) records.push(p);
      onProgress && onProgress({ done: records.length, total: quantity, attempts: stats.attempts });
      await tick();
    }
    // بازبینی نهایی: هر سریال پذیرفته‌شده دوباره از پچ می‌گذرد و یکتایی دسته تأیید می‌شود
    const seen = new Set();
    for (const r of records) { const v = validate(r.serial, brand, model); if (v.status !== 'VALID' || seen.has(r.serial)) return await fail('INTERNAL_VALIDATION', 'بازبینی نهایی ناموفق بود؛ همه‌ی رزروها بازگردانده شد.'); seen.add(r.serial); }
    await store.commitJob(jobId);
  } catch (e) {
    if (e instanceof GenerationError) throw e;
    await store.rollbackJob(jobId).catch(() => {});
    Object.assign(job, { part: null, partId: null, status: 'failed', error: 'STORE_FAILURE', message: String(e && e.message || e), finishedAt: Date.now() });
    await store.putJob(job).catch(() => {});
    throw new GenerationError('STORE_FAILURE', 'خطای ذخیره‌ساز؛ تراکنش بازگردانده شد و چیزی ذخیره نشد: ' + (e && e.message || e), { job });
  }
  Object.assign(job, { status: 'done', generated: records.length, finishedAt: Date.now() });
  await store.putJob(job); await store.addAudit({ jobId, action: 'generation-done', detail: { generated: records.length, stats } });
  return { job, records: records.map(r => ({ ...r, status: 'committed' })) };
}
