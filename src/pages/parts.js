/* صفحه‌ی پارت‌ها: تاریخچه‌ی هر پارت (تولید شماره‌دار)، جزئیات فنی و نمودارها، خروجی جدا برای هر پارت */
import { dataTable } from '../components/table.js';
import { pill } from '../components/ui.js';
import { columns, histogram, heatmap, donut, colorOf } from '../components/charts.js';
import { resultRows, RESULT_COLUMNS } from '../services/rows.js';
import { positionMatrix, nearestDistanceHistogram, partRows } from '../services/analytics.js';
import { ALPHABETS } from '../generator/generator.js';
import { esc, nf } from '../utils/text.js';

export function mountParts(host, ctx) {
  host.innerHTML = `<div class="panel"><h2>پارت‌های تولید</h2>
    <p class="muted">هر تولید موفق یک «پارت» شماره‌دار برای همان مدل است و برای همیشه در این مرورگر می‌ماند. روی «جزئیات» بزنید تا نمودارها و سریال‌های همان پارت و خروجی جدا برای آن را ببینید.</p>
    <div id="ptChart"></div><div id="ptT"></div></div>
    <div id="ptDetail"></div>`;
  const $ = s => host.querySelector(s);
  const t = dataTable($('#ptT'), { name: 'parts', sheet: 'Parts', title: 'پارت‌های تولید', rowKey: 'partId', selectable: false, pageSize: 15, empty: 'هنوز پارتی ساخته نشده است.',
    filters: [{ label: 'مدل', get: r => r.model, options: [] }],
    columns: [{ key: 'partId', label: 'پارت', cls: 'mono', sortVal: r => r.partId }, { key: 'brand', label: 'برند' }, { key: 'model', label: 'مدل' }, { key: 'time', label: 'زمان', sortVal: r => r.ts },
      { key: 'quantity', label: 'تعداد', sortVal: r => r.quantity }, { key: 'dist', label: 'حداقل فاصله‌ی تعیین‌شده', sortVal: r => r.minDistance }, { key: 'sim', label: 'ردشده: شبیه', sortVal: r => r.sim }, { key: 'hist', label: 'سریال قبلی هنگام ساخت', sortVal: r => r.historyCount },
      { key: 'srcFa', label: 'منبع قاعده', html: r => pill(r.src === 'USER_DECLARED' ? 'p-info' : 'p-ok', r.srcFa), text: r => r.srcFa },
      { key: 'open', label: '', sort: false, html: r => `<button class="btn small" data-open="${esc(r.partId)}">جزئیات</button>`, text: () => '' }] });
  let jobsCache = [], recsCache = [];
  async function render() {
    if (!ctx.store) return;
    jobsCache = partRows(await ctx.store.jobs_()); recsCache = await ctx.store.all();
    const rows = jobsCache.map(j => ({ partId: j.partId, brand: j.brand, model: j.model, ts: j.startedAt, time: new Date(j.startedAt).toLocaleString('fa-IR'), quantity: j.generated ?? j.quantity, minDistance: j.minDistance || 0,
      dist: j.minDistance ? `≥ ${nf(j.minDistance)}` : '—', sim: j.stats?.rejectedSimilar || 0, historyCount: j.historyCount || 0, src: j.ruleSource === 'USER_DECLARED' ? 'USER_DECLARED' : 'PATCH', srcFa: j.ruleSource === 'USER_DECLARED' ? 'اعلام کاربر' : 'پچ' }));
    const models = [...new Set(rows.map(r => r.model))], sel = host.querySelector('select[data-f="0"]');
    if (sel) { const cur = sel.value; sel.innerHTML = '<option value="">مدل: همه</option>' + models.map(m => `<option>${esc(m)}</option>`).join(''); sel.value = cur; }
    t.setRows(rows.slice().reverse());
    $('#ptChart').innerHTML = rows.length ? `<h3>اندازه‌ی هر پارت (به ترتیب زمان)</h3>${columns(rows.map(r => ({ label: r.partId, value: r.quantity, color: colorOf(models.indexOf(r.model)), sub: r.model })), { unit: ' سریال' })}` : '';
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openPart(b.dataset.open); });
  function openPart(partId) {
    const j = jobsCache.find(x => x.partId === partId); if (!j) return;
    const mine = recsCache.filter(r => r.partId === partId), others = recsCache.filter(r => r.brand === j.brand && r.model === j.model && r.partId !== partId);
    const alpha = ALPHABETS[j.alphabet] || ALPHABETS.digits, rows = resultRows(mine.sort((a, b) => a.createdAt - b.createdAt));
    const pl = mine[0]?.prefix.length ?? 0, cur = mine.map(r => r.serial.slice(pl));
    const earlier = others.filter(r => r.createdAt < (mine[0]?.createdAt ?? Infinity) && r.serial.length === mine[0]?.serial.length).map(r => r.serial.slice(pl));
    const self = nearestDistanceHistogram(cur, cur, { same: true }), vs = earlier.length ? nearestDistanceHistogram(cur, earlier) : null;
    const bk = h => Object.keys(h.hist).sort((a, b) => a - b).map(d => ({ label: `فاصله ${nf(d)}`, value: h.hist[d] }));
    const byLen = {}; mine.forEach(r => { byLen[`طول ${r.length} / ${r.prefix}`] = (byLen[`طول ${r.length} / ${r.prefix}`] || 0) + 1; });
    const s = j.stats || {};
    $('#ptDetail').innerHTML = `<div class="panel"><h2>جزئیات ${esc(partId)} <span class="tag">${esc(j.brand)} / ${esc(j.model)}</span></h2>
      ${j.ruleSource === 'USER_DECLARED' ? '<div class="banner info">برند این پارت «اعلام کاربر» است (SP600 = Newland)؛ پچ فقط مدل را تأیید می‌کند.</div>' : ''}
      <div class="grid kpis"><div class="stat"><b>${nf(mine.length)}</b><span>سریال در این پارت</span></div><div class="stat"><b>${nf(s.attempts || 0)}</b><span>تلاش برای ساخت</span></div>
        <div class="stat"><b>${nf(s.rejectedSimilar || 0)}</b><span>ردشده چون شبیه بود</span></div><div class="stat"><b>${vs ? nf(vs.min) : '—'}</b><span>حداقل فاصله تا پارت‌های قبل (نمونه)</span></div>
        <div class="stat"><b>${self.min == null ? '—' : nf(self.min)}</b><span>حداقل فاصله‌ی درون پارت (نمونه)</span></div><div class="stat"><b>${nf(j.historyCount || 0)}</b><span>سریال قبلی هنگام ساخت</span></div></div>
      <div class="two"><div><h3>نزدیک‌ترین سریال از پارت‌های قبلی</h3>${vs ? histogram(bk(vs)) : '<p class="muted">این پارت اولین پارت این مدل است.</p>'}<p class="muted">${vs?.approximate || self.approximate ? 'نمونه‌گیری شده (حداکثر ۲۵۰ سریال در برابر ۴۰۰۰ سریال)؛ نمای تقریبی است نه اثبات. اثبات روی خود شاخص تفاوت و تست‌ها تکیه دارد.' : 'محاسبه روی همه‌ی داده انجام شد.'}</p></div>
      <div><h3>نزدیک‌ترین سریال در همین پارت</h3>${histogram(bk(self))}</div></div>
      <div class="two"><div><h3>توزیع نویسه در جایگاه‌های بخش متغیر</h3>${heatmap(positionMatrix(mine.map(r => r.serial), pl, alpha.chars))}</div>
      <div><h3>الگوی طول و پیشوند</h3>${donut(Object.entries(byLen).map(([label, value], i) => ({ label, value, color: colorOf(i) })), { center: 'سریال' })}</div></div></div>
      <div class="panel"><h3>سریال‌های ${esc(partId)}</h3><div id="ptRows"></div></div>`;
    const pt = dataTable($('#ptRows'), { name: partId, sheet: partId.slice(0, 31), title: 'سریال‌های ' + partId, rowKey: 'serial', pageSize: 50, columns: RESULT_COLUMNS(pill), empty: 'سریالی نیست.' });
    pt.setRows(rows); $('#ptDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return { render };
}
