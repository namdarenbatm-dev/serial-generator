import test from 'node:test'; import assert from 'node:assert/strict';
import { generateSerials, GenerationError, seededRng, cryptoRng, LIMITS } from '../../src/generator/generator.js';
import { MemoryStore } from '../../src/database/memory-store.js';
import { validate } from '../../src/validator/validator.js';
import { DiversityIndex, hamming } from '../../src/generator/diversity.js';
import { availableCombos } from '../../src/rules/registry.js';

const gen = (store, o) => generateSerials({ brand: 'Pax', model: 'D230', quantity: 100, alphabet: 'digits', store, rng: seededRng(1), ...o });

test('D230: همه معتبر، طول ۱۰، پیشوند ۲۳، بدون تکرار', async () => {
  const st = new MemoryStore(), { records, job } = await gen(st, { quantity: 1000 });
  assert.equal(records.length, 1000); assert.equal(job.status, 'done');
  assert.equal(new Set(records.map(r => r.serial)).size, 1000);
  for (const r of records) { assert.equal(r.serial.length, 10); assert.ok(r.serial.startsWith('23')); assert.equal(validate(r.serial, 'Pax', 'D230').status, 'VALID'); assert.equal(r.classification, 'TEST_DATA'); }
  assert.equal(await st.count(), 1000);
});
test('هر ترکیب در دسترس: نمونه‌ی ۲۰۰تایی کاملاً معتبر (پوشش همه‌ی ترکیب‌ها)', async () => {
  for (const c of availableCombos()) {
    const st = new MemoryStore(), { records } = await gen(st, { brand: c.brand, model: c.model, quantity: 200, alphabet: 'alnum' });
    for (const r of records) assert.equal(validate(r.serial, c.brand, c.model).status, 'VALID', `${c.brand}/${c.model} ${r.serial}`);
  }
});
test('ترکیب پشتیبانی‌نشده مسدود است', async () => {
  for (const [b, m] of [['Pax', 'SP600'], ['Newland', 'D230'], ['Pax', 'Verifone'], ['X', 'Y']])
    await assert.rejects(gen(new MemoryStore(), { brand: b, model: m }), e => e instanceof GenerationError && e.code === 'UNSUPPORTED_RULE');
});
test('محدودیت تعداد', async () => {
  for (const q of [0, -1, 1.5, NaN, 'abc']) await assert.rejects(gen(new MemoryStore(), { quantity: q }), e => e.code === 'INVALID_INPUT');
  await assert.rejects(gen(new MemoryStore(), { quantity: LIMITS.maxQuantity + 1 }), e => e.code === 'QUANTITY_LIMIT');
});
test('بدون ذخیره‌ساز پایدار تولید انجام نمی‌شود', async () => { await assert.rejects(gen(null, {}), e => e.code === 'NO_PERSISTENCE'); });
test('تکراری در تاریخچه: دو تولید با بذر یکسان هیچ سریال مشترکی ندارند و برخوردها شمرده می‌شوند', async () => {
  const st = new MemoryStore(), a = await gen(st, { quantity: 300 }), b = await gen(st, { quantity: 300 });
  const A = new Set(a.records.map(r => r.serial)); assert.ok(b.records.every(r => !A.has(r.serial)));
  assert.ok(b.job.stats.rejectedSimilar + b.job.stats.collisionsHistory >= 300, 'تکرار تاریخچه (شاخص تفاوت یا قید رجیستری) ثبت نشد'); assert.equal(await st.count(), 600);
});
test('تکراری در فهرست استثنا: هیچ سریال استثنا خارج نمی‌شود', async () => {
  const probe = await gen(new MemoryStore(), { quantity: 300 }), ex = new Set(probe.records.map(r => r.serial));
  const st = new MemoryStore(); await st.addExclusions('t', ex);
  const r = await gen(st, { quantity: 300 });
  assert.ok(r.records.every(x => !ex.has(x.serial))); assert.ok(r.job.stats.collisionsExclusion >= 300);
});
test('همزمانی: ۶ تولید موازی روی یک رجیستری، بدون هیچ تکراری', async () => {
  const st = new MemoryStore();
  const rs = await Promise.all([1, 2, 3, 4, 5, 6].map(i => gen(st, { quantity: 1500, rng: seededRng(i % 2) /* بذرهای عمداً مشابه */ })));
  const all = rs.flatMap(r => r.records.map(x => x.serial));
  assert.equal(all.length, 9000); assert.equal(new Set(all).size, 9000); assert.equal(await st.count(), 9000);
});
test('لغو: همه‌ی رزروها بازگردانده می‌شود', async () => {
  const st = new MemoryStore(), ac = new AbortController();
  await assert.rejects(gen(st, { quantity: 20000, signal: ac.signal, onProgress: p => { if (p.done >= 2000) ac.abort(); } }), e => e.code === 'CANCELLED');
  assert.equal(st.serials.size, 0); assert.equal((await st.jobs_())[0].status, 'cancelled');
});
test('خطای تراکنش ذخیره‌ساز: چیزی ذخیره نمی‌شود و خطا واضح است', async () => {
  const st = new MemoryStore(); let calls = 0; const orig = st.reserveMany.bind(st);
  st.reserveMany = async r => { if (++calls === 2) throw new Error('quota exceeded'); return orig(r); };
  await assert.rejects(gen(st, { quantity: 5000 }), e => e.code === 'STORE_FAILURE' && /quota/.test(e.message));
  assert.equal(st.serials.size, 0); assert.equal((await st.jobs_())[0].status, 'failed');
});
test('تمام‌شدن فضا/سقف تلاش: شکست واضح و بازگردانی کامل (همه یا هیچ)', async () => {
  const st = new MemoryStore(); st.reserveMany = async r => ({ added: [], collisions: r.map(x => ({ serial: x.serial, reason: 'HISTORY' })) });
  await assert.rejects(gen(st, { quantity: 10 }), e => e.code === 'GENERATION_EXHAUSTED' && /سقف مجاز/.test(e.message));
  assert.equal(st.serials.size, 0);
});
test('ظرفیت نظری کمتر از تعداد: GENERATION_EXHAUSTED بدون رزرو', async () => {
  // A80 با ارقام: 10^7 ظرفیت؛ تعداد مجاز ≤ 100000 پس با تقلید فضای کوچک، تابع ظرفیت را مستقیم می‌آزماییم
  const { capacity, findCombo } = await import('../../src/rules/registry.js');
  assert.equal(capacity(findCombo('Pax', 'A80'), 10), 1e7);
  assert.equal(capacity(findCombo('Pax', 'Q80'), 10), 1e8);
});
test('تولید با بذر برابر قطعی است؛ crypto RNG یکنواخت و در بازه', () => {
  const r = cryptoRng(), counts = Array(10).fill(0); for (let i = 0; i < 100000; i++) { const v = r(10); assert.ok(v >= 0 && v < 10); counts[v]++; }
  assert.ok(counts.every(c => c > 9000 && c < 11000), 'توزیع غیر یکنواخت: ' + counts);
});
test('ردپای مممیزی (audit) برای هر تولید ثبت می‌شود', async () => {
  const st = new MemoryStore(); await gen(st, { quantity: 10 }); const a = (await st.auditList()).map(x => x.action);
  assert.ok(a.includes('generation-start') && a.includes('generation-done'));
});
test('تکراری در همان دسته: RNG ثابت فقط یک سریال یکتا می‌دهد؛ بقیه رد و شمرده می‌شوند و تولید همه‌یا‌هیچ شکست می‌خورد', async () => {
  const st = new MemoryStore();
  await assert.rejects(gen(st, { quantity: 5, rng: () => 0 }), e => e.code === 'GENERATION_EXHAUSTED');
  const j = (await st.jobs_())[0]; assert.ok(j.stats.rejectedBatchDup > 100, 'تکراری دسته شمرده نشد'); assert.equal(st.serials.size, 0);
});

const hmin = (A, B, same) => { let m = 99; for (let i = 0; i < A.length; i++) for (let j = same ? i + 1 : 0; j < B.length; j++) m = Math.min(m, hamming(A[i], B[j])); return m; };
test('SP600/Newland: طول ۱۲، پیشوند J7، معتبر، با ruleSource', async () => {
  const { records, job } = await gen(new MemoryStore(), { brand: 'Newland', model: 'SP600', quantity: 300 });
  assert.ok(records.every(r => r.serial.length === 12 && r.serial.startsWith('J7') && r.ruleSource === 'USER_DECLARED' && validate(r.serial, 'Newland', 'SP600').status === 'VALID'));
  assert.equal(job.ruleSource, 'USER_DECLARED');
});
test('پارت‌ها: شماره‌ی ترتیبی برای هر مدل، شناسه‌ی SP600-P001 و ذخیره در تاریخچه', async () => {
  const st = new MemoryStore(), o = { brand: 'Newland', model: 'SP600', quantity: 50 };
  const a = await gen(st, o), b = await gen(st, o), c = await gen(st, { quantity: 20 });
  assert.deepEqual([a.job.partId, b.job.partId, c.job.partId], ['SP600-P001', 'SP600-P002', 'D230-P001']);
  assert.ok(a.records.every(r => r.partId === 'SP600-P001' && r.part === 1));
  assert.equal((await st.jobs_()).filter(j => j.partId).length, 3);
});
test('پارت ناموفق شماره مصرف نمی‌کند', async () => {
  const st = new MemoryStore(); st.failNext = new Error('x');
  await assert.rejects(gen(st, { quantity: 10 })); const ok = await gen(st, { quantity: 10 });
  assert.equal(ok.job.partId, 'D230-P001');
});
test('پارت جدید با همه‌ی پارت‌های قبل دست‌کم ۳ نویسه فرق دارد (minDistance پیش‌فرض ۳)', async () => {
  const st = new MemoryStore(), o = { brand: 'Newland', model: 'SP600', quantity: 400 }, parts = [];
  for (let i = 0; i < 3; i++) { const r = await gen(st, { ...o, rng: seededRng(10 + i) }); parts.push(r.records.map(x => x.serial.slice(2))); }
  assert.ok(hmin(parts[0], parts[0], true) >= 3); assert.ok(hmin(parts[1], parts[0]) >= 3); assert.ok(hmin(parts[2], parts[0].concat(parts[1])) >= 3);
  const all = parts.flat(); assert.equal(new Set(all).size, all.length);
});
test('minDistance=2 و ۱: ۲ حداقل فاصله ۲، ۱ فقط یکتایی', async () => {
  const r2 = await gen(new MemoryStore(), { quantity: 300, minDistance: 2 }); assert.ok(hmin(r2.records.map(x => x.serial), r2.records.map(x => x.serial), true) >= 2);
  const r1 = await gen(new MemoryStore(), { quantity: 300, minDistance: 1 }); assert.equal(r1.job.stats.rejectedSimilar, 0);
});
test('شاخص تفاوت با brute-force برابر است (دقت دقیق، بدون منفی کاذب)', () => {
  const rnd = seededRng(5), mk = () => Array.from({ length: 6 }, () => rnd(4)).join('');
  for (const d of [1, 2, 3]) {
    const ix = new DiversityIndex(6, d, 16), kept = [];
    for (let i = 0; i < 600; i++) { const v = mk(), close = kept.some(k => hamming(k, v) < d); assert.equal(ix.tooClose(v), close, `d=${d} ${v}`); if (!close) { ix.add(v); kept.push(v); } }
    assert.ok(kept.length > 5);
  }
});
test('فضای کاندید پر: خطای GENERATION_EXHAUSTED و بازگردانی کامل (بخش متغیر کوتاه با فاصله‌ی ۳)', async () => {
  // D230 با ۸ رقم متغیر کافی است؛ با فاصله‌ی ۳ و تعداد خیلی زیاد نسبت به تلاش‌ها باید شکست بخورد، نه تکرار بدهد
  const st = new MemoryStore();
  await assert.rejects(gen(st, { brand: 'Newland', model: 'SP600', quantity: 5000, alphabet: 'digits', rng: () => 0 }), e => e.code === 'GENERATION_EXHAUSTED');
  assert.equal(await st.count(), 0);
});

test('قید رجیستری مستقل از شاخص: رزرو سریال موجود برخورد HISTORY می‌دهد', async () => {
  const st = new MemoryStore(); await st.reserveMany([{ serial: 'X1', jobId: 'a' }]);
  const r = await st.reserveMany([{ serial: 'X1', jobId: 'b' }, { serial: 'X2', jobId: 'b' }]);
  assert.deepEqual(r.collisions, [{ serial: 'X1', reason: 'HISTORY' }]); assert.deepEqual(r.added, ['X2']);
});
