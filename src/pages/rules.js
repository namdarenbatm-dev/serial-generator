import { REGISTRY, STATUS_FA, STATUS, combinations } from '../rules/registry.js';
import PATCH from '../rules/patch-rules.js';
import { esc, nf } from '../utils/text.js';
import { dataTable } from '../components/table.js';
import { pill } from '../components/ui.js';
import { rulesMatrix } from '../components/charts.js';

export function mountRules(host) {
  host.innerHTML = `<div class="panel"><h2>قواعد برند و مدل</h2>
    <p class="muted">این جدول مستقیماً از متن VBA ساخته شده است. فقط ردیف‌های «تأیید‌شده» برای تولید در دسترس‌اند. بقیه با دلیل غیرفعال‌اند و هیچ رابطه‌ی برند و مدلی حدس زده نمی‌شود.</p>
    <p class="muted">منبع: ${esc(PATCH.source)} | توابع: Brand_SerialCartKhan (ماژول Module79)، Model_SerialCartKhan (ماژول Module3) | تابع‌های دیگر (Model_PartCartKhan، x_Model_Noskheh) روی شماره‌ی قطعه و نسخه کار می‌کنند، نه سریال، و عمداً خارج از دامنه‌اند.</p>
    <div data-t></div></div>
    <div class="panel"><h3>ماتریس قواعد (طول × پیشوند)</h3><p class="muted">سبز: تأییدشده در پچ | آبی: اعلام کاربر | نارنجی: ناقص | قرمز: ناسازگار.</p><div data-m></div></div>
    <div class="panel"><h3>ترکیب‌های برند/مدل</h3><div data-c></div></div>`;
  const rows = REGISTRY.map(e => ({ id: e.id, brand: e.brand || '—', model: e.model || '—', length: e.length, prefix: e.prefix + (e.subsumedBy ? ' (زیرمجموعه‌ی ' + e.subsumedBy.split(':')[1] + ')' : ''), priority: e.priority, status: e.status, statusFa: STATUS_FA[e.status], src: e.sources.map(s => `${s.function} ${s.module}:${s.line}`).join(' ، '), note: e.reason || e.note || '' }));
  const t = dataTable(host.querySelector('[data-t]'), { name: 'patch-rules', sheet: 'Rules', title: 'قواعد پچ', rowKey: 'id', selectable: false, pageSize: 25,
    filters: [{ label: 'وضعیت', get: r => r.status, options: Object.entries(STATUS_FA).map(([k, v]) => [k, v]) }, { label: 'برند', get: r => r.brand, options: [...new Set(rows.map(r => r.brand))].map(b => [b, b]) }],
    columns: [
      { key: 'brand', label: 'برند' }, { key: 'model', label: 'مدل' }, { key: 'length', label: 'طول', sortVal: r => r.length }, { key: 'prefix', label: 'پیشوند', cls: 'mono' },
      { key: 'priority', label: 'اولویت (ترتیب VBA)', sortVal: r => r.priority },
      { key: 'statusFa', label: 'وضعیت استخراج و اعتبارسنجی', html: r => pill(r.status === STATUS.VERIFIED ? 'p-ok' : r.status === STATUS.USER_DECLARED ? 'p-info' : 'p-warn', r.statusFa), text: r => r.statusFa },
      { key: 'src', label: 'مرجع VBA (تابع ماژول:خط)', cls: 'wrapc mono' }, { key: 'note', label: 'توضیح', cls: 'wrapc' }] });
  t.setRows(rows);
  host.querySelector('[data-m]').innerHTML = rulesMatrix(REGISTRY.filter(e => !e.subsumedBy), e => e.status === STATUS.VERIFIED ? 'ok' : e.status === STATUS.USER_DECLARED ? 'usr' : e.status === STATUS.CONFLICT ? 'bad' : 'warn', e => STATUS_FA[e.status]);
  const cb = combinations().sort((a, b) => Number(b.available) - Number(a.available));
  host.querySelector('[data-c]').innerHTML = `<div class="tbl"><table><thead><tr><th>برند</th><th>مدل</th><th>در دسترس</th><th>الگوهای تأییدشده</th><th>دلیل</th></tr></thead><tbody>${cb.map(c => `<tr><td>${esc(c.brand || '—')}</td><td>${esc(c.model || '—')}</td><td>${pill(c.available ? (c.userDeclared ? 'p-info' : 'p-ok') : 'p-bad', c.available ? (c.userDeclared ? 'بله (اعلام کاربر)' : 'بله') : 'خیر')}</td><td class="mono">${c.templates.map(x => x.length + ':' + x.prefix).join(' ')}</td><td class="wrapc">${esc(c.reasons.join(' '))}</td></tr>`).join('')}</tbody></table></div>`;
  return { render() {} };
}
