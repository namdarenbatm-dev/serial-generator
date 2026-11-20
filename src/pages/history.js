import { dataTable } from '../components/table.js';
import { pill } from '../components/ui.js';
import { nf } from '../utils/text.js';

const FA = { done: 'موفق', failed: 'ناموفق', cancelled: 'لغو‌شده', running: 'در حال اجرا' };
export function mountHistory(host, ctx) {
  host.innerHTML = `<div class="panel"><h2>تاریخچه‌ی تولید</h2><div id="hjT"></div></div><div class="panel"><h3>ردپای ممیزی</h3><div id="haT"></div></div>`;
  const t = dataTable(host.querySelector('#hjT'), { name: 'generation-history', sheet: 'Jobs', rowKey: 'id', selectable: false, pageSize: 20, filters: [{ label: 'وضعیت', get: r => r.status, options: Object.entries(FA) }],
    columns: [{ key: 'time', label: 'زمان' }, { key: 'partId', label: 'پارت', cls: 'mono' }, { key: 'brand', label: 'برند' }, { key: 'model', label: 'مدل' }, { key: 'quantity', label: 'تعداد خواسته', sortVal: r => r.quantity }, { key: 'generated', label: 'تولیدشده', sortVal: r => r.generated },
      { key: 'statusFa', label: 'وضعیت', html: r => pill(r.status === 'done' ? 'p-ok' : r.status === 'running' ? 'p-info' : 'p-bad', r.statusFa), text: r => r.statusFa },
      { key: 'attempts', label: 'تلاش', sortVal: r => r.attempts }, { key: 'coll', label: 'برخورد' }, { key: 'ms', label: 'مدت (ms)', sortVal: r => r.ms }, { key: 'cls', label: 'طبقه‌بندی / دامنه' }, { key: 'msg', label: 'پیام', cls: 'wrapc' }], empty: 'تولیدی ثبت نشده است.' });
  const a = dataTable(host.querySelector('#haT'), { name: 'audit-log', sheet: 'Audit', rowKey: 'id', selectable: false, pageSize: 20,
    columns: [{ key: 'time', label: 'زمان' }, { key: 'action', label: 'رویداد' }, { key: 'jobId', label: 'تولید', cls: 'mono' }, { key: 'detail', label: 'جزئیات', cls: 'wrapc mono' }] });
  async function render() {
    if (!ctx.store) return;
    t.setRows((await ctx.store.jobs_()).map(j => ({ id: j.id, partId: j.partId || '—', time: new Date(j.startedAt).toLocaleString('fa-IR'), brand: j.brand, model: j.model, quantity: j.quantity, generated: j.generated ?? 0, status: j.status, statusFa: FA[j.status] || j.status, attempts: j.stats?.attempts ?? 0, coll: nf((j.stats?.collisionsHistory || 0) + (j.stats?.collisionsExclusion || 0)), ms: j.finishedAt ? j.finishedAt - j.startedAt : 0, cls: 'داده‌ی آزمایشی / رجیستری محلی', msg: j.message || '' })));
    a.setRows((await ctx.store.auditList()).slice(0, 2000).map(x => ({ id: x.id, time: new Date(x.ts).toLocaleString('fa-IR'), action: x.action, jobId: x.jobId || '', detail: x.detail ? JSON.stringify(x.detail) : '' })));
  }
  return { render };
}
