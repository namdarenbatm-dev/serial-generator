import { resultRows, RESULT_COLUMNS } from '../services/rows.js';
import { dataTable } from '../components/table.js';
import { pill } from '../components/ui.js';
import { nf } from '../utils/text.js';

export function mountRecords(host, ctx) {
  host.innerHTML = `<div class="panel"><h2>سریال‌های تولیدشده</h2><p class="muted" id="rcInfo"></p><div id="rcT"></div></div>`;
  const t = dataTable(host.querySelector('#rcT'), { name: 'records', sheet: 'Records', title: 'سریال‌های ذخیره‌شده', rowKey: 'serial', pageSize: 50,
    filters: [{ label: 'برند', get: r => r.brand, options: [] }, { label: 'اعتبارسنجی', get: r => r.vstatus, options: [['VALID', 'معتبر'], ['INVALID', 'نامعتبر']] }],
    columns: RESULT_COLUMNS(pill), empty: 'هنوز سریالی ذخیره نشده است.' });
  async function render() {
    if (!ctx.store) { host.querySelector('#rcInfo').textContent = 'ذخیره‌ساز در دسترس نیست.'; return; }
    const recs = (await ctx.store.all()).sort((a, b) => a.createdAt - b.createdAt), rows = resultRows(recs);
    host.querySelector('#rcInfo').textContent = `${nf(rows.length)} سریال. هر ردیف هنگام نمایش دوباره با پچ اعتبارسنجی می‌شود (نه فقط اعتماد به مقدار ذخیره‌شده).`;
    // گزینه‌های فیلتر برند را از داده بساز
    const sel = host.querySelector('select[data-f="0"]'); if (sel) { const cur = sel.value; sel.innerHTML = `<option value="">برند: همه</option>` + [...new Set(rows.map(r => r.brand))].map(b => `<option>${b}</option>`).join(''); sel.value = cur; }
    t.setRows(rows);
  }
  return { render };
}
