import test from 'node:test'; import assert from 'node:assert/strict';
import { toCsv, parseCsvSafe, csvCell, FILE_LIMITS } from '../../src/utils/csv.js';
import { IO } from '../../src/utils/legacy-io.js';

test('CSV: رفت‌وبرگشت با کوتیشن، ویرگول، خط جدید و فارسی', () => {
  const rows = [['2331439294', 'a,b', 'x"y', 'خط\nدوم', 'برند']];
  const back = parseCsvSafe(toCsv(['s', 'a', 'b', 'c', 'd'], rows)); assert.deepEqual(back[1], rows[0]); assert.deepEqual(back[0], ['s', 'a', 'b', 'c', 'd']);
});
test('CSV: فرمول‌ها خنثی می‌شوند (CSV injection)', () => { for (const v of ['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\tx']) assert.ok(csvCell(v).startsWith(`"'`), v); assert.equal(csvCell('2331439294'), '"2331439294"'); });
test('CSV: BOM و CRLF و فایل ناقص', () => {
  assert.deepEqual(parseCsvSafe('﻿a,b\r\n1,2\r\n'), [['a', 'b'], ['1', '2']]);
  assert.throws(() => parseCsvSafe('a,"b'), /ناقص/);
});
test('CSV: حد ردیف', () => { assert.throws(() => parseCsvSafe('a\n'.repeat(11), { maxRows: 10 }), /حد مجاز/); assert.equal(FILE_LIMITS.maxBytes, 8 * 1024 * 1024); });
test('Excel: ساخت و خواندن مجدد، سریال به‌صورت متن می‌ماند (صفرهای ابتدایی حفظ)', async () => {
  const rows = [['0800123456', 'Pax', 'Q80'], ['2331439294', 'Pax', 'D230'], ['124ABC7890', 'Pax', 'A80']];
  const bytes = IO.buildXlsx([{ name: 'Serials', header: ['serial', 'brand', 'model'], rows, widths: [20, 10, 10] }]);
  assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4B);
  const t = await IO.openTable(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 'x.xlsx');
  const back = await t.getRows(0); assert.deepEqual(back.slice(1), rows); assert.deepEqual(back[0], ['serial', 'brand', 'model']);
});
test('Excel: فایل خراب پیام فارسی می‌دهد، بدون کرش', async () => {
  await assert.rejects(IO.openTable(new Uint8Array([0x50, 0x4B, 1, 2, 3, 4, 5]).buffer, 'bad.xlsx'));
});
test('inflate خالص JS با داده‌ی فشرده‌ی استاندارد برابر است (مرورگرهای بدون DecompressionStream)', async () => {
  const zlib = await import('node:zlib'), data = Buffer.from('2331439294\n'.repeat(5000)); assert.ok(Buffer.from(IO.inflateJS(new Uint8Array(zlib.deflateRawSync(data)))).equals(data));
});
