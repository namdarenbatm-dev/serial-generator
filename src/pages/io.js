import { IO } from '../utils/legacy-io.js';
import { parseCsvSafe, FILE_LIMITS } from '../utils/csv.js';
import { normalizeIdentity, esc, nf, download, stamp } from '../utils/text.js';
import { toast, confirmDialog, emit } from '../components/ui.js';

/** خواندن امن فهرست سریال از CSV/TXT/XLSX؛ ستون سریال: اولین ستونی که بیشترین سلول غیرخالی دارد */
export async function readSerialList(file) {
  if (file.size > FILE_LIMITS.maxBytes) throw new Error(`حجم فایل بیش از ${FILE_LIMITS.maxBytes / 1048576} مگابایت است.`);
  const buf = await file.arrayBuffer(), u8 = new Uint8Array(buf);
  let rows;
  if (u8[0] === 0x50 && u8[1] === 0x4B) { const t = await IO.openTable(buf, file.name); rows = await t.getRows(0); }
  else if (u8[0] === 0xD0 && u8[1] === 0xCF) throw new Error('فرمت قدیمی .xls پشتیبانی نمی‌شود؛ آن را به .xlsx یا CSV تبدیل کنید.');
  else rows = parseCsvSafe(new TextDecoder('utf-8').decode(buf));
  if (rows.length > FILE_LIMITS.maxRows) throw new Error('تعداد ردیف‌ها از حد مجاز بیشتر است.');
  const width = Math.max(0, ...rows.map(r => r.length)); let best = 0, bestN = -1;
  for (let c = 0; c < width; c++) { const n = rows.filter(r => r[c] != null && String(r[c]).trim() !== '').length; if (n > bestN) { best = c; bestN = n; } }
  const out = []; let skipped = 0;
  rows.forEach((r, i) => { const v = r[best] == null ? '' : normalizeIdentity(r[best]); if (!v || (i === 0 && /[^\x00-\x7f]/.test(v))) { if (v) skipped++; return; } out.push(v); });
  return { serials: out, skipped, column: best + 1 };
}
export async function importExclusionFile(store, file) {
  if (!store) throw new Error('ذخیره‌ساز پایدار در دسترس نیست.');
  const { serials } = await readSerialList(file);
  if (!serials.length) throw new Error('سریالی در فایل پیدا نشد.');
  return store.addExclusions(file.name, serials);
}

export function mountIO(host, ctx) {
  host.innerHTML = `<div class="panel"><h2>ورود و خروج داده</h2>
    <h3>فهرست استثنا</h3><p class="muted">سریال‌های این فهرست هرگز تولید نمی‌شوند. فایل حداکثر ${FILE_LIMITS.maxBytes / 1048576} مگابایت؛ فرمت‌های CSV، TXT، XLSX. مقایسه حساس به حروف است و فقط فاصله‌ی دو سر حذف می‌شود (مثل Trim در VBA).</p>
    <div class="form"><label>فایل فهرست استثنا<input type="file" id="ioEx" accept=".csv,.txt,.tsv,.xlsx"></label><div class="acts"><button class="btn danger" id="ioClrEx">پاک کردن همه‌ی استثناها</button></div></div><p class="muted" id="ioExN"></p>
    <h3>خروجی</h3><p class="muted">برای خروجی با جستجو و فیلتر از بخش «سریال‌های تولیدشده» استفاده کنید. اینجا پشتیبان کامل می‌گیرید:</p>
    <div class="acts"><button class="btn primary" id="ioBackup">پشتیبان JSON (سریال‌ها، تولیدها، ردپا)</button><button class="btn" id="ioXlsx">همه‌ی سریال‌ها (Excel)</button><button class="btn" id="ioCsv">همه‌ی سریال‌ها (CSV)</button></div>
    <h3>حذف داده</h3><div class="acts"><button class="btn danger" id="ioDel">حذف همه‌ی سریال‌های ذخیره‌شده</button></div></div>`;
  const $ = s => host.querySelector(s);
  async function render() { $('#ioExN').textContent = ctx.store ? `تعداد سریال در فهرست‌های استثنا: ${nf(await ctx.store.exclusionCount())}` : 'ذخیره‌ساز در دسترس نیست.'; }
  $('#ioEx').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const r = await importExclusionFile(ctx.store, f); toast(`${nf(r.added)} سریال افزوده شد؛ ${nf(r.dup)} تکراری رد شد.`); emit('data-changed'); } catch (er) { toast(er.message, true); } e.target.value = ''; });
  $('#ioClrEx').addEventListener('click', async () => { if (await confirmDialog('همه‌ی فهرست‌های استثنا پاک شوند؟ این کار برگشت‌پذیر نیست.', 'پاک کردن')) { await ctx.store.clearExclusions(); await ctx.store.addAudit({ action: 'exclusions-cleared' }); toast('فهرست استثنا پاک شد.'); emit('data-changed'); } });
  $('#ioDel').addEventListener('click', async () => { const n = await ctx.store.count(); if (!n) return toast('سریالی برای حذف نیست.'); if (await confirmDialog(`${nf(n)} سریال ذخیره‌شده برای همیشه حذف شود؟ سریال‌های حذف‌شده دوباره قابل تولید می‌شوند و تضمین یکتایی نسبت به آن‌ها از بین می‌رود.`, 'حذف همه')) { await ctx.store.deleteAllSerials(); await ctx.store.addAudit({ action: 'serials-deleted', detail: { count: n } }); toast('همه‌ی سریال‌ها حذف شد.'); emit('data-changed'); } });
  const rowsOf = async () => (await ctx.store.all()).map((r, i) => [i + 1, r.serial, r.partId || '', r.brand, r.model, r.length, r.prefix, r.ruleId, r.jobId, new Date(r.createdAt).toISOString(), 'داده‌ی آزمایشی', 'رجیستری محلی', r.ruleSource === 'USER_DECLARED' ? 'اعلام کاربر' : 'پچ']);
  const HDR = ['ردیف', 'سریال', 'پارت', 'برند', 'مدل', 'طول', 'پیشوند', 'شناسه‌ی قاعده', 'شناسه‌ی تولید', 'زمان ساخت', 'طبقه‌بندی', 'دامنه‌ی یکتایی', 'منبع قاعده'];
  $('#ioXlsx').addEventListener('click', async () => { const r = await rowsOf(); if (!r.length) return toast('سریالی نیست.'); download(`all-serials-${stamp()}.xlsx`, IO.buildXlsx([{ name: 'Serials', header: HDR, rows: r, widths: [7, 24, 12, 12, 12, 7, 10, 12, 24, 26, 14, 16] }]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); toast(`${nf(r.length)} ردیف در Excel.`); });
  $('#ioCsv').addEventListener('click', async () => { const { toCsv } = await import('../utils/csv.js'); const r = await rowsOf(); if (!r.length) return toast('سریالی نیست.'); download(`all-serials-${stamp()}.csv`, toCsv(HDR, r), 'text/csv;charset=utf-8'); toast(`${nf(r.length)} ردیف در CSV.`); });
  $('#ioBackup').addEventListener('click', async () => { const o = { app: 'pos-serial-generator', exportedAt: new Date().toISOString(), scope: 'LOCAL_REGISTRY', serials: await ctx.store.all(), jobs: await ctx.store.jobs_(), audit: await ctx.store.auditList() }; download(`psg-backup-${stamp()}.json`, JSON.stringify(o), 'application/json'); toast('پشتیبان ساخته شد.'); });
  return { render };
}
