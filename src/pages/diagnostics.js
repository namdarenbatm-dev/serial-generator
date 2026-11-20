import { detect } from '../core/vba.js';
import { REGISTRY, availableCombos } from '../rules/registry.js';
import { locksAvailable } from '../services/engine.js';
import { pill, toast } from '../components/ui.js';
import { esc, nf } from '../utils/text.js';

export function mountDiagnostics(host, ctx) {
  host.innerHTML = `<div class="panel"><h2>تشخیص سیستم</h2><div class="tbl"><table><tbody id="dgT"></tbody></table></div>
    <div class="acts"><button class="btn primary" id="dgSelf">اجرای خودآزمون برابری با نمونه‌های طلایی</button></div><p class="muted" id="dgOut" role="status"></p></div>`;
  const $ = s => host.querySelector(s);
  async function render() {
    const est = ctx.store?.estimate ? await ctx.store.estimate() : null, sw = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const row = (k, ok, v) => `<tr><td>${esc(k)}</td><td>${pill(ok === true ? 'p-ok' : ok === false ? 'p-bad' : 'p-info', ok === true ? 'سالم' : ok === false ? 'مشکل' : 'اطلاع')}</td><td class="wrapc">${esc(v)}</td></tr>`;
    $('#dgT').innerHTML = [
      row('ذخیره‌ساز پایدار (IndexedDB)', !!ctx.store, ctx.store ? 'باز شد و آزمون نوشتن موفق بود' : ('در دسترس نیست: ' + (ctx.storeError || '') + ' | تولید مسدود است')),
      row('قفل بین‌تبی (Web Locks)', locksAvailable() ? true : null, locksAvailable() ? 'فعال' : 'در دسترس نیست؛ یکتایی فقط با قید پایگاه‌داده تضمین می‌شود'),
      row('Service Worker', sw ? true : null, sw ? 'ثبت‌شده؛ برنامه آفلاین بالا می‌آید' : 'ثبت نشده (روی http/localhost یا https لازم است)'),
      row('اتصال', null, navigator.onLine ? 'آنلاین' : 'آفلاین (یکتایی فقط در رجیستری محلی)'),
      row('فضای ذخیره‌سازی', null, est ? `استفاده‌شده ${nf(Math.round(est.usage / 1024))} KB از ${nf(Math.round(est.quota / 1048576))} MB` : 'نامشخص'),
      row('قواعد استخراج‌شده', true, `${REGISTRY.length} الگو؛ ${availableCombos().length} ترکیب تأییدشده`),
      row('دامنه‌ی یکتایی', null, 'LOCAL_REGISTRY: فقط همین مرورگر و همین دستگاه'),
      row('اجرای برابری با VBA واقعی', null, 'NOT VERIFIED: فقط با مفسر متن VBA مقایسه شده، نه Excel')].join('');
  }
  $('#dgSelf').addEventListener('click', async () => {
    $('#dgOut').textContent = 'در حال دریافت و مقایسه…';
    try {
      const g = await (await fetch('tests/golden/golden.json')).json(); let bad = 0;
      for (const [s, b, m] of g.cases) { const d = detect(s); if ((d.brand ?? null) !== (b ?? null) || d.model !== m) bad++; }
      $('#dgOut').textContent = bad ? `خودآزمون ناموفق: ${nf(bad)} اختلاف از ${nf(g.cases.length)}` : `خودآزمون موفق: ${nf(g.cases.length)} مورد بدون اختلاف با خروجی مفسر VBA.`;
      toast($('#dgOut').textContent, !!bad);
    } catch (e) { $('#dgOut').textContent = 'دریافت نمونه‌های طلایی ممکن نشد (آفلاین و کش‌نشده؟): ' + e.message; }
  });
  return { render };
}
