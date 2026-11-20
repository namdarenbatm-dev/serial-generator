/* CSV امن: حد حجم/ردیف، پشتیبانی از کوتیشن، و خنثی‌سازی فرمول‌های Excel در خروجی */
export const FILE_LIMITS = { maxBytes: 8 * 1024 * 1024, maxRows: 500000 };
export function parseCsvSafe(text, limits = FILE_LIMITS) {
  const rows = []; let row = [], cell = '', q = false;
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"' && cell === '') q = true;
    else if (c === ',' || c === ';' || c === '\t') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x !== '')) rows.push(row); row = []; if (rows.length > limits.maxRows) throw new Error('تعداد ردیف‌های فایل از حد مجاز بیشتر است.'); }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some(x => x !== '')) rows.push(row); }
  if (q) throw new Error('فایل CSV ناقص است (کوتیشن بسته نشده).');
  return rows;
}
const danger = /^[=+\-@\t\r]/;
export function csvCell(v) {
  let s = String(v ?? '');
  if (danger.test(s)) s = "'" + s;           // جلوگیری از اجرای فرمول در Excel
  return '"' + s.replace(/"/g, '""') + '"';
}
export function toCsv(header, rows) { return '﻿' + [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n'); }
