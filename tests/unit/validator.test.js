import test from 'node:test'; import assert from 'node:assert/strict';
import { validate } from '../../src/validator/validator.js';
test('D230 معتبر', () => assert.equal(validate('2331439294', 'Pax', 'D230').status, 'VALID'));
test('طول اشتباه → INVALID', () => assert.equal(validate('233143929', 'Pax', 'D230').status, 'INVALID'));
test('پیشوند اشتباه با طول درست → INVALID', () => assert.equal(validate('2431439294', 'Pax', 'D230').status, 'INVALID'));
test('سریال خالی و فقط فاصله → INVALID', () => { assert.equal(validate('', 'Pax', 'D230').status, 'INVALID'); assert.equal(validate('   ', 'Pax', 'D230').status, 'INVALID'); });
test('Trim فقط فاصله را برمی‌دارد: فاصله‌ی دو سر مجاز، tab یا NBSP نه', () => {
  assert.equal(validate('  2331439294  ', 'Pax', 'D230').status, 'VALID');
  assert.equal(validate('\t2331439294', 'Pax', 'D230').status, 'INVALID');
  assert.equal(validate('2331439294 ', 'Pax', 'D230').status, 'INVALID');
});
test('حساسیت به حروف: 2K مدل S80 دارد؛ 2k فقط برند دارد (در جدول مدل نیست) پس برای S80 پذیرفته نمی‌شود', () => {
  assert.equal(validate('2K123456', 'Pax', 'S80').status, 'VALID');
  assert.equal(validate('2k123456', 'Pax', 'S80').status, 'INVALID');
  assert.equal(validate('2k123456', 'Pax', 'S90').status, 'INVALID');
  assert.equal(validate('2x123456', 'Pax', 'S80').status, 'INVALID');
});
test('ترکیب پشتیبانی‌نشده → UNSUPPORTED_RULE', () => { assert.equal(validate('J71234567890', 'Pax', 'SP600').status, 'UNSUPPORTED_RULE'); assert.equal(validate('J71234567890', 'Pax', 'Nope').status, 'UNSUPPORTED_RULE'); });
test('ناهمخوانی مدل: سریال D230 برای مدل Q80', () => assert.equal(validate('2331439294', 'Pax', 'Q80').status, 'INVALID'));
test('ناهمخوانی برند و مدل از خروجی پچ', () => {
  const v = validate('1241111111', 'Pax', 'A80'); assert.equal(v.status, 'VALID');
  assert.equal(validate('0800000000', 'Pax', 'Q80').status, 'VALID');
});
test('سریال تکراری با ctx.dup → DUPLICATE با توضیح فارسی', () => { const v = validate('2331439294', 'Pax', 'D230', { dup: 'HISTORY' }); assert.equal(v.status, 'DUPLICATE'); assert.match(v.explanation, /تاریخچه/); });
test('نویسه‌ی کنترلی → INVALID', () => assert.equal(validate('23314\u00002929', 'Pax', 'D230').status, 'INVALID'));
test('ارقام فارسی/تمام‌عرض نرمال نمی‌شوند (VBA هم نرمال نمی‌کند)', () => { assert.equal(validate('٢٣٣١٤٣٩٢٩٤', 'Pax', 'D230').status, 'INVALID'); assert.equal(validate('２３３１４３９２９４', 'Pax', 'D230').status, 'INVALID'); });

test('SP600/Newland: معتبر با منبع USER_DECLARED؛ طول و پیشوند اشتباه نامعتبر', () => {
  const v = validate('J70123456789', 'Newland', 'SP600'); assert.equal(v.status, 'VALID'); assert.equal(v.source, 'USER_DECLARED'); assert.match(v.explanation, /اعلام کاربر/);
  assert.equal(validate('J7012345678', 'Newland', 'SP600').status, 'INVALID');
  assert.equal(validate('K70123456789', 'Newland', 'SP600').status, 'INVALID');
});
