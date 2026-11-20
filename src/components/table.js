/* جدول داده: جستجو، فیلتر، مرتب‌سازی، صفحه‌بندی، انتخاب گروهی، کپی (تکی/انتخابی/همه)، CSV، Excel، چاپ */
import { esc, nf, download, stamp } from '../utils/text.js';
import { toCsv } from '../utils/csv.js';
import { IO } from '../utils/legacy-io.js';
import { copyText, toast } from './ui.js';

export function dataTable(host, o) {
  const st = { rows: [], view: [], q: '', sort: null, page: 0, sel: new Set(), filters: {}, size: o.pageSize || 50 };
  const cols = o.columns, text = (r, c) => String(c.text ? c.text(r) : (c.get ? c.get(r) : r[c.key]) ?? '');
  host.innerHTML = `
    <div class="tbar">
      <input type="search" placeholder="جستجو…" aria-label="جستجو" data-q>
      ${(o.filters || []).map((f, i) => `<select data-f="${i}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}: همه</option>${f.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`).join('')}
      <span class="grow muted" data-count></span>
      <button class="btn small" data-act="copysel">کپی انتخاب‌شده</button><button class="btn small" data-act="copyall">کپی همه</button>
      <button class="btn small" data-act="csv">CSV</button><button class="btn small" data-act="xlsx">Excel</button><button class="btn small" data-act="print">چاپ</button>
    </div>
    <div class="tbl"><table><thead><tr>${o.selectable !== false ? '<th><input type="checkbox" data-all aria-label="انتخاب صفحه"></th>' : ''}${cols.map((c, i) => `<th class="${c.sort === false ? '' : 'sortable'}" data-s="${i}">${esc(c.label)}</th>`).join('')}<th></th></tr></thead><tbody></tbody></table></div>
    <div class="pager"><button class="btn small" data-p="-1">قبلی</button><span data-pi></span><button class="btn small" data-p="1">بعدی</button></div>`;
  const $q = s => host.querySelector(s), tb = $q('tbody');

  function apply() {
    const q = st.q.trim().toLowerCase();
    st.view = st.rows.filter(r => (!q || r.__t.includes(q)) && (o.filters || []).every((f, i) => !st.filters[i] || String(f.get(r)) === st.filters[i]));
    if (st.sort) { const c = cols[st.sort.i], d = st.sort.dir; st.view = st.view.slice().sort((a, b) => { const x = c.sortVal ? c.sortVal(a) : text(a, c), y = c.sortVal ? c.sortVal(b) : text(b, c); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true })) * d; }); }
    const pages = Math.max(1, Math.ceil(st.view.length / st.size)); if (st.page >= pages) st.page = pages - 1;
    draw(pages);
  }
  function draw(pages) {
    const slice = st.view.slice(st.page * st.size, (st.page + 1) * st.size), key = o.rowKey;
    tb.innerHTML = slice.length ? slice.map(r => `<tr>${o.selectable !== false ? `<td><input type="checkbox" data-sel="${esc(r[key])}" ${st.sel.has(r[key]) ? 'checked' : ''} aria-label="انتخاب"></td>` : ''}${cols.map(c => `<td class="${c.cls || ''}">${c.html ? c.html(r) : esc(text(r, c))}</td>`).join('')}<td><button class="btn small" data-copy="${esc(r[o.copyKey || key])}" aria-label="کپی">کپی</button></td></tr>`).join('') : `<tr><td colspan="${cols.length + 2}" class="muted">${esc(o.empty || 'ردیفی نیست.')}</td></tr>`;
    $q('[data-count]').textContent = `${nf(st.view.length)} ردیف${st.sel.size ? ' | انتخاب‌شده: ' + nf(st.sel.size) : ''}`;
    $q('[data-pi]').textContent = `صفحه ${nf(st.page + 1)} از ${nf(pages)}`;
    host.querySelectorAll('[data-p]').forEach(b => { b.disabled = (+b.dataset.p < 0 && st.page === 0) || (+b.dataset.p > 0 && st.page >= pages - 1); });
    ['copysel'].forEach(a => { $q(`[data-act=${a}]`).disabled = !st.sel.size; });
    ['copyall', 'csv', 'xlsx', 'print'].forEach(a => { $q(`[data-act=${a}]`).disabled = !st.view.length; });
  }
  const exportData = () => ({ header: cols.map(c => c.label), rows: st.view.map(r => cols.map(c => text(r, c))) });
  host.addEventListener('input', e => { if (e.target.matches('[data-q]')) { st.q = e.target.value; st.page = 0; apply(); } });
  host.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-f]')) { st.filters[t.dataset.f] = t.value; st.page = 0; apply(); }
    else if (t.matches('[data-sel]')) { t.checked ? st.sel.add(t.dataset.sel) : st.sel.delete(t.dataset.sel); draw(Math.max(1, Math.ceil(st.view.length / st.size))); }
    else if (t.matches('[data-all]')) { st.view.slice(st.page * st.size, (st.page + 1) * st.size).forEach(r => t.checked ? st.sel.add(r[o.rowKey]) : st.sel.delete(r[o.rowKey])); draw(Math.max(1, Math.ceil(st.view.length / st.size))); }
  });
  host.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.s !== undefined) { const i = +b.dataset.s; } 
    if (b.dataset.p) { st.page += +b.dataset.p; apply(); return; }
    if (b.dataset.copy !== undefined) { toast((await copyText(b.dataset.copy)) ? 'کپی شد.' : 'کپی انجام نشد.', false); return; }
    const a = b.dataset.act; if (!a) return;
    const ck = o.copyKey || o.rowKey;
    if (a === 'copysel') { const v = st.rows.filter(r => st.sel.has(r[o.rowKey])).map(r => r[ck]); toast((await copyText(v.join('\n'))) ? `${nf(v.length)} مورد کپی شد.` : 'کپی انجام نشد.'); }
    if (a === 'copyall') { const v = st.view.map(r => r[ck]); toast((await copyText(v.join('\n'))) ? `${nf(v.length)} مورد کپی شد.` : 'کپی انجام نشد.'); }
    if (a === 'csv') { const d = exportData(); download(`${o.name || 'export'}-${stamp()}.csv`, toCsv(d.header, d.rows), 'text/csv;charset=utf-8'); toast(`فایل CSV با ${nf(d.rows.length)} ردیف ساخته شد.`); }
    if (a === 'xlsx') { const d = exportData(); download(`${o.name || 'export'}-${stamp()}.xlsx`, IO.buildXlsx([{ name: (o.sheet || 'Data').slice(0, 31), header: d.header, rows: d.rows, widths: cols.map(c => c.width || 18) }]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); toast(`فایل Excel با ${nf(d.rows.length)} ردیف ساخته شد.`); }
    if (a === 'print') {
      const d = exportData(), cap = 5000, rows = d.rows.slice(0, cap);
      const pa = document.createElement('div'); pa.id = 'printArea';
      pa.innerHTML = `<h3>${esc(o.title || o.name || '')}</h3><table><thead><tr>${d.header.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${d.rows.length > cap ? `<p>فقط ${cap} ردیف اول چاپ شد؛ برای همه از Excel استفاده کنید.</p>` : ''}`;
      document.body.appendChild(pa); window.addEventListener('afterprint', () => pa.remove(), { once: true }); window.print();
    }
  });
  host.querySelector('thead').addEventListener('click', e => {
    const th = e.target.closest('th[data-s]'); if (!th || th.classList.contains('sortable') === false) return;
    const i = +th.dataset.s; st.sort = st.sort && st.sort.i === i ? { i, dir: -st.sort.dir } : { i, dir: 1 }; apply();
  });
  return {
    setRows(rows) { st.rows = rows; rows.forEach(r => { r.__t = cols.map(c => text(r, c)).join('\u0001').toLowerCase(); }); st.sel.clear(); st.page = 0; apply(); },
    selected: () => st.rows.filter(r => st.sel.has(r[o.rowKey])), view: () => st.view
  };
}
