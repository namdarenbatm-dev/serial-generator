import test from 'node:test'; import assert from 'node:assert/strict';
import PATCH from '../../src/rules/patch-rules.js';
import { REGISTRY, availableCombos, findCombo, STATUS, capacity } from '../../src/rules/registry.js';
import { detectBrand, detectModel } from '../../src/core/vba.js';

test('هیچ خط VBA تفسیرنشده‌ای باقی نمانده', () => assert.deepEqual(PATCH.unresolvedLines, []));
test('همه‌ی قواعد برند و مدل ردپای منبع دارند', () => {
  for (const [fn, f] of Object.entries(PATCH.functions)) for (const r of f.rules) { assert.ok(r.line > 0 && r.text.includes(r.prefix) && f.module, `${fn}:${r.line}`); }
});
test('پوشش ۱۰۰٪ قواعد: برای هر قاعده نمونه‌ای ساخته می‌شود که یا همان مقدار را می‌دهد یا قاعده‌ی بعدیِ بازنویس‌کننده دارد', () => {
  let n = 0;
  for (const [fn, f] of Object.entries(PATCH.functions)) for (const r of f.rules) {
    const L = r.length ?? Math.max(10, r.prefix.length), probe = r.prefix + '5'.repeat(L - r.prefix.length);
    const got = fn === 'Brand_SerialCartKhan' ? detectBrand(probe) : detectModel(probe);
    const later = f.rules.some(o => o.seq > r.seq && (o.length === null || o.length === probe.length) && probe.startsWith(o.prefix) && o.value !== r.value);
    assert.ok(got === r.value || later, `${fn} خط ${r.line}: انتظار ${r.value} گرفت ${got}`); n++;
  }
  assert.equal(n, PATCH.functions.Brand_SerialCartKhan.rules.length + PATCH.functions.Model_SerialCartKhan.rules.length);
});
test('ترکیب D230 فقط طول ۱۰ و پیشوند ۲۳ دارد', () => {
  const c = findCombo('Pax', 'D230'); assert.ok(c); assert.deepEqual(c.templates.map(t => [t.length, t.prefix]), [[10, '23']]);
});
test('ترکیب‌های ناقص یا ناسازگار در دسترس نیستند (برند یا مدل حدس زده نمی‌شود)', () => {
  assert.equal(findCombo('Pax', 'SP600'), null, 'برند اشتباه برای SP600 پذیرفته نمی‌شود');
  assert.equal(findCombo(null, 'SP600'), null);
  assert.equal(findCombo('Pax', 'Verifone'), null, 'L8:21 ناسازگار است');
  assert.ok(REGISTRY.some(e => e.id === 'L8:21' && e.status === STATUS.CONFLICT));
  assert.ok(REGISTRY.filter(e => e.status === STATUS.MODEL_ONLY).every(e => e.brand === null && !e.userDeclared));
  assert.ok(REGISTRY.filter(e => e.status === STATUS.BRAND_ONLY).every(e => e.model === null));
});
test('A80 فقط با پیشوند ۱۲۴ و طول ۱۰ (برند از قانون سراسری ۱۲۴)', () => {
  const c = findCombo('Pax', 'A80'); assert.deepEqual(c.templates.map(t => [t.length, t.prefix]), [[10, '124']]);
});
test('ظرفیت نظری محاسبه می‌شود', () => assert.equal(capacity(findCombo('Pax', 'D230'), 10), 1e8));

test('SP600 = Newland: اعلام کاربر، جدا از پچ و با برچسب', () => {
  const c = findCombo('Newland', 'SP600'); assert.ok(c); assert.equal(c.source, 'USER_DECLARED'); assert.equal(c.userDeclared, true);
  assert.deepEqual(c.templates.map(t => [t.length, t.prefix, t.status]), [[12, 'J7', 'USER_DECLARED']]);
  assert.ok(availableCombos().filter(x => x.model !== 'SP600').every(x => x.source === 'PATCH'));
  assert.equal(PATCH.functions.Brand_SerialCartKhan.rules.some(r => r.value === 'Newland'), false, 'پچ برند Newland ندارد؛ اعلام فقط در لایه‌ی declarations است');
});
