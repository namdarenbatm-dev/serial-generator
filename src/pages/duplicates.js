import { readSerialList } from './io.js';
import { dataTable } from '../components/table.js';
import { toast, pill } from '../components/ui.js';
import { normalizeIdentity, nf, esc } from '../utils/text.js';
import { detect } from '../core/vba.js';

export function mountDuplicates(host, ctx) {
  host.innerHTML = `<div class="panel"><h2>تشخیص تکرار</h2>
    <p class="muted">فهرستی از سریال‌ها را بچسبانید یا فایل بدهید. تکرار در خود فهرست، در تاریخچه‌ی تولیدها و در فهرست‌های استثنا بررسی می‌شود. (مقایسه حساس به حروف، فقط Trim فاصله.)</p>
    <div class="form"><label class="wide">سریال‌ها، هر خط یکی<textarea id="dpT" rows="6" placeholder="2331439294&#10;2331439295"></textarea></label><label>یا فایل<input type="file" id="dpF" accept=".csv,.txt,.tsv,.xlsx"></label><div class="acts"><button class="btn primary" id="dpGo">بررسی تکرار</button></div></div>
    <div id="dpSum" class="sum"></div><div id="dpT2"></div></div>`;
  const $ = s => host.querySelector(s);
  const cols = [
    { key: 'n', label: 'ردیف', sortVal: r => r.n }, { key: 'serial', label: 'سریال', cls: 'mono' }, { key: 'brand', label: 'برند پچ' }, { key: 'model', label: 'مدل پچ' },
    { key: 'status', label: 'وضعیت تکرار', html: r => pill(r.code === 'NONE' ? 'p-ok' : 'p-warn', r.status), text: r => r.status }];
  const t = dataTable($('#dpT2'), { name: 'duplicate-check', sheet: 'Duplicates', title: 'بررسی تکرار', rowKey: 'serial', copyKey: 'serial', pageSize: 50, columns: cols,
    filters: [{ label: 'وضعیت', get: r => r.code, options: [['NONE', 'یکتا'], ['BATCH', 'تکرار در فهرست'], ['HISTORY', 'در تاریخچه'], ['EXCLUSION', 'در استثنا']] }] });
  t.setRows([]);
  let fileSerials = null;
  $('#dpF').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const r = await readSerialList(f); fileSerials = r.serials; $('#dpT').value = r.serials.slice(0, 2000).join('\n') + (r.serials.length > 2000 ? '\n…' : ''); toast(`${nf(r.serials.length)} سریال از فایل خوانده شد.`); } catch (er) { toast(er.message, true); fileSerials = null; } });
  $('#dpGo').addEventListener('click', async () => {
    if (!ctx.store) return toast('ذخیره‌ساز در دسترس نیست.', true);
    const list = (fileSerials && $('#dpT').value.includes('…') ? fileSerials : $('#dpT').value.split(/\r?\n/).map(normalizeIdentity).filter(Boolean));
    if (!list.length) return toast('سریالی وارد نشده است.', true);
    const ext = await ctx.store.lookup([...new Set(list)]), seen = new Set(), FA = { NONE: 'یکتا', BATCH: 'تکرار در فهرست', HISTORY: 'در تاریخچه‌ی تولید', EXCLUSION: 'در فهرست استثنا' };
    const rows = list.map((s, i) => { let code = ext.get(s) || 'NONE'; if (seen.has(s)) code = 'BATCH'; seen.add(s); const d = detect(s); return { n: i + 1, serial: s, brand: d.brand ?? '—', model: d.model || '—', code, status: FA[code] }; });
    const c = k => rows.filter(r => r.code === k).length;
    $('#dpSum').innerHTML = [['کل', rows.length], ['یکتا', c('NONE')], ['تکرار در فهرست', c('BATCH')], ['در تاریخچه', c('HISTORY')], ['در استثنا', c('EXCLUSION')]].map(([l, v]) => `<div class="stat"><b>${nf(v)}</b><span>${l}</span></div>`).join('');
    t.setRows(rows);
  });
  return { render() {} };
}
