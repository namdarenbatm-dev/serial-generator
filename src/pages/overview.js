import { REGISTRY, availableCombos, STATUS } from '../rules/registry.js';
import PATCH from '../rules/patch-rules.js';
import { ALPHABETS } from '../generator/generator.js';
import { capacity } from '../rules/registry.js';
import { partRows } from '../services/analytics.js';
import { sparkline, columns, donut, gauge, colorOf } from '../components/charts.js';
import { esc, nf } from '../utils/text.js';

export function mountOverview(host, ctx) {
  async function render() {
    const recs = ctx.store ? await ctx.store.all() : [], allJobs = ctx.store ? await ctx.store.jobs_() : [], ex = ctx.store ? await ctx.store.exclusionCount() : 0, parts = partRows(allJobs);
    const byModel = {}, byBrand = {}; recs.forEach(r => { const k = `${r.brand} / ${r.model}`; byModel[k] = (byModel[k] || 0) + 1; byBrand[r.brand] = (byBrand[r.brand] || 0) + 1; });
    const cum = []; let acc = 0; parts.forEach(j => { acc += j.generated || 0; cum.push(acc); });
    const sim = parts.reduce((s, j) => s + (j.stats?.rejectedSimilar || 0), 0), att = parts.reduce((s, j) => s + (j.stats?.attempts || 0), 0);
    const stat = c => REGISTRY.filter(e => e.status === c).length, avail = availableCombos();
    const used = avail.filter(c => byModel[`${c.brand} / ${c.model}`]);
    const sp = sparkline(cum);
    host.innerHTML = `
      <div class="panel hero"><h2>نمای کلی</h2>
        <p class="muted">فقط «داده‌ی آزمایشی منطبق با تشخیص پچ» ساخته می‌شود. پچ BrandPAX.xlam قاعده‌ی «تخصیص سریال» ندارد، فقط طول و چند نویسه‌ی اول را برای تشخیص برند و مدل می‌سنجد. SP600 طبق اعلام شما Newland است (اعلام کاربر، نه پچ).</p>
        <div class="grid kpis">
          <div class="stat k"><b>${nf(recs.length)}</b><span>سریال در رجیستری محلی</span>${sp}</div>
          <div class="stat k"><b>${nf(parts.length)}</b><span>پارت ثبت‌شده</span></div>
          <div class="stat k"><b>${att ? (sim / att * 100).toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + '٪' : '—'}</b><span>تلاش‌هایی که چون شبیه بودند رد شدند</span></div>
          <div class="stat k"><b>${nf(ex)}</b><span>سریال در فهرست‌های استثنا</span></div>
          <div class="stat k"><b>${nf(avail.length)}</b><span>ترکیب برند/مدل فعال (${nf(avail.filter(c => c.userDeclared).length)} اعلام کاربر)</span></div>
          <div class="stat k"><b>${nf(stat(STATUS.BRAND_ONLY) + stat(STATUS.MODEL_ONLY) + stat(STATUS.CONFLICT))}</b><span>الگوی مسدود (ناقص یا ناسازگار)</span></div>
        </div></div>
      <div class="two">
        <div class="panel"><h3>سهم هر برند</h3>${donut(Object.entries(byBrand).map(([label, value], i) => ({ label, value, color: colorOf(i) })), { center: 'سریال' })}</div>
        <div class="panel"><h3>سریال‌های هر مدل</h3>${columns(Object.entries(byModel).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label: label.split(' / ')[1], sub: label.split(' / ')[0], value, color: colorOf(i) })), { unit: ' سریال' })}</div>
      </div>
      <div class="panel"><h3>پارت‌ها در گذر زمان</h3>${parts.length ? columns(parts.map(j => ({ label: j.partId, sub: j.model, value: j.generated || 0, color: colorOf(avail.findIndex(c => c.model === j.model)) })), { unit: ' سریال' }) : '<p class="muted">هنوز پارتی ساخته نشده است.</p>'}</div>
      <div class="panel"><h3>مصرف فضای ممکن هر مدل</h3><p class="muted">سریال‌های ذخیره‌شده نسبت به ظرفیت نظری (الفبای ارقام). اعداد کوچک طبیعی‌اند چون فضا بسیار بزرگ است.</p>
        <div class="grid gauges">${(used.length ? used : avail.slice(0, 4)).map(c => gauge(recs.filter(r => r.brand === c.brand && r.model === c.model).length / capacity(c, ALPHABETS.digits.chars.length), { label: `${c.brand} / ${c.model}`, sub: `ظرفیت نظری ${capacity(c, 10) >= 1e15 ? '≥ ۱۰¹۵' : nf(capacity(c, 10))}`, color: colorOf(avail.indexOf(c)) })).join('')}</div></div>
      <div class="panel"><h3>چه چیزی تضمین می‌شود و چه چیزی نه</h3>
        <ul><li><b>تضمین‌شده (با تست):</b> هر سریال تولیدشده با پورت JS تابع‌های VBA پچ همان مدل را می‌دهد؛ تکراری در همین رجیستری محلی پذیرفته نمی‌شود؛ پارت جدید با همه‌ی پارت‌های قبلی همان مدل دست‌کم به‌اندازه‌ی «حداقل فاصله»ی انتخابی (پیش‌فرض ۳ نویسه) فرق دارد.</li>
        <li><b>تضمین نشده:</b> یکتایی سراسری یا بین دستگاه‌ها؛ منطبق بودن با سریال‌های واقعی سازنده؛ اجرای برابر با Excel واقعی (فقط با مفسر متن VBA مقایسه شده است)؛ درستی برند Newland برای SP600 از خود پچ (فقط اعلام شماست).</li></ul></div>`;
  }
  return { render };
}
