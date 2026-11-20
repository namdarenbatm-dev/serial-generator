import { brands, modelsOf, findCombo, capacity, combinations } from '../rules/registry.js';
import { ALPHABETS, LIMITS, GenerationError, DIVERSITY_LEVELS } from '../generator/generator.js';
import { generate, locksAvailable } from '../services/engine.js';
import { resultRows, RESULT_COLUMNS } from '../services/rows.js';
import { dataTable } from '../components/table.js';
import { toast, pill, emit } from '../components/ui.js';
import { esc, nf } from '../utils/text.js';
import { importExclusionFile } from './io.js';
import { histogram } from '../components/charts.js';
import { nearestDistanceHistogram } from '../services/analytics.js';

export function mountGenerate(host, ctx) {
  const blocked = combinations().filter(c => !c.available);
  host.innerHTML = `<div class="panel"><h2>تولید سریال آزمایشی</h2>
    <p class="muted">برند و مدل را از فهرست تأییدشده‌ی پچ انتخاب کنید. هر سریال پیش از ذخیره با پورت تابع‌های VBA سنجیده می‌شود.</p>
    <form class="form" id="gf" novalidate>
      <label>برند<select id="gBrand" required></select></label>
      <label>مدل<select id="gModel" required></select></label>
      <label>تعداد (۱ تا ${nf(LIMITS.maxQuantity)})<input id="gQty" type="number" min="1" max="${LIMITS.maxQuantity}" step="1" value="100" inputmode="numeric" required></label>
      <label>حالت تولید<select id="gMode"><option value="random">تصادفی (داده‌ی آزمایشی)</option></select></label>
      <label class="wide">تفاوت با پارت‌های قبلی (پارت جدید چقدر باید فرق کند؟)
        <select id="gDiv">${DIVERSITY_LEVELS.map(d => `<option value="${d.id}" ${d.id === 3 ? 'selected' : ''}>${d.label}</option>`).join('')}</select></label>
      <label class="wide">بخش متغیر سریال (تصمیم مهندسی، خارج از پچ)
        <select id="gAlpha">${Object.values(ALPHABETS).map(a => `<option value="${a.id}">${a.label}</option>`).join('')}</select></label>
      <p class="muted wide" id="gInfo"></p>
      <p class="muted wide">هر تولید یک «پارت» شماره‌دار برای همان مدل می‌شود (مثلاً SP600-P003) و در تاریخچه می‌ماند. تفاوت یعنی فاصله‌ی همینگ بخش متغیر با تک‌تک سریال‌های پارت‌های قبلی همان مدل و همان الگو (تعداد جایگاه‌های نویسه‌ی متفاوت)؛ این تعریف دقیق «کاملاً متفاوت» در این برنامه است. حالت‌های ترتیبی، پیشوندمحور و کنترل‌شده فعال نیستند، چون پچ هیچ منطق تخصیصی برای آن‌ها تعریف نکرده است. پچ فقط طول و ۲ تا ۴ نویسه‌ی اول را می‌شناسد؛ نویسه‌های بعدی را به انتخاب شما (بالا) و به‌صورت تصادفی پر می‌کنیم.</p>
      <label class="wide">فهرست استثنا (اختیاری): فایل CSV، TXT یا Excel از سریال‌هایی که نباید تولید شوند<input id="gEx" type="file" accept=".csv,.txt,.tsv,.xlsx"></label>
      <label class="chk wide"><input type="checkbox" id="gAck"><span>می‌دانم این سریال‌ها «فقط داده‌ی آزمایشی»اند: رسمی، تولیدی یا صادرشده‌ی سازنده نیستند، و بخش متغیر آن‌ها طبق پچ نیست.</span></label>
      <div class="wide acts"><button class="btn primary" id="gGo" type="submit">تولید و اعتبارسنجی</button><button class="btn" id="gCancel" type="button" disabled>لغو</button></div>
    </form>
    <div class="progress" aria-hidden="true"><i id="gBar"></i></div><p class="muted" id="gStat" role="status"></p>
    <div id="gSum" class="sum"></div></div>
    <div class="panel"><h3>نتایج</h3><div id="gTable"></div></div>
    <div class="panel"><details><summary>الگوهای غیرفعال و دلیل آن‌ها (${nf(blocked.length)})</summary><div class="tbl"><table><thead><tr><th>برند</th><th>مدل</th><th>دلیل</th></tr></thead><tbody>${blocked.map(c => `<tr><td>${esc(c.brand || '—')}</td><td>${esc(c.model || '—')}</td><td class="wrapc">${esc(c.reasons.join(' '))}</td></tr>`).join('')}</tbody></table></div></details></div>`;
  const $ = s => host.querySelector(s), selB = $('#gBrand'), selM = $('#gModel'), info = $('#gInfo');
  selB.innerHTML = brands().map(b => `<option>${esc(b)}</option>`).join('');
  const fillModels = () => { selM.innerHTML = modelsOf(selB.value).map(m => `<option>${esc(m)}</option>`).join(''); upd(); };
  function upd() {
    const c = findCombo(selB.value, selM.value); if (!c) { info.textContent = ''; return; }
    const cap = capacity(c, ALPHABETS[$('#gAlpha').value].chars.length);
    info.textContent = `${c.userDeclared ? '⚠ برند این مدل اعلام کاربر است (در پچ نیست). ' : ''}الگوها: ${c.templates.map(t => `طول ${t.length} با پیشوند «${t.prefix}»`).join('، ')} | ظرفیت نظری: ${cap >= 1e15 ? '≥ ۱۰¹۵' : nf(cap)}`;
  }
  selB.onchange = fillModels; selM.onchange = upd; $('#gAlpha').onchange = upd; fillModels();
  const table = dataTable($('#gTable'), { name: 'generated-serials', sheet: 'Serials', title: 'سریال‌های تولیدشده', rowKey: 'serial', pageSize: 50,
    filters: [{ label: 'اعتبارسنجی', get: r => r.vstatus, options: [['VALID', 'معتبر'], ['INVALID', 'نامعتبر'], ['DUPLICATE', 'تکراری']] }], columns: RESULT_COLUMNS(pill), empty: 'هنوز تولیدی انجام نشده است.' });
  table.setRows([]);

  let ac = null;
  $('#gEx').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = await importExclusionFile(ctx.store, f); toast(`فهرست استثنا: ${nf(r.added)} سریال افزوده شد، ${nf(r.dup)} تکراری رد شد.`); emit('data-changed'); }
    catch (err) { toast(err.message, true); } e.target.value = '';
  });
  $('#gf').addEventListener('submit', async e => {
    e.preventDefault();
    if (!ctx.store) return toast('ذخیره‌ساز پایدار در دسترس نیست؛ بدون آن تولید مجاز نیست: ' + (ctx.storeError || ''), true);
    if (!$('#gAck').checked) return toast('برای ادامه باید «فقط داده‌ی آزمایشی» بودن را تأیید کنید.', true);
    const qty = Number($('#gQty').value);
    if (!Number.isInteger(qty) || qty < 1 || qty > LIMITS.maxQuantity) return toast(`تعداد باید عدد صحیح بین ۱ و ${nf(LIMITS.maxQuantity)} باشد.`, true);
    ac = new AbortController(); $('#gGo').disabled = true; $('#gCancel').disabled = false; $('#gSum').innerHTML = ''; $('#gStat').textContent = locksAvailable() ? 'در حال تولید…' : 'در حال تولید… (قفل بین‌تبی در این مرورگر نیست؛ یکتایی با قید پایگاه‌داده تضمین می‌شود.)';
    try {
      const { job, records } = await generate({ brand: selB.value, model: selM.value, quantity: qty, alphabet: $('#gAlpha').value, minDistance: Number($('#gDiv').value), store: ctx.store, signal: ac.signal,
        onProgress: p => { $('#gBar').style.width = (p.done / p.total * 100) + '%'; $('#gStat').textContent = `${nf(p.done)} از ${nf(p.total)} | تلاش‌ها: ${nf(p.attempts)}`; } });
      const s = job.stats; $('#gBar').style.width = '100%';
      table.setRows(resultRows(records));
      $('#gStat').textContent = `${job.partId} | انجام شد: ${nf(records.length)} سریال یکتا و معتبر در ${nf(Math.round((job.finishedAt - job.startedAt)))} میلی‌ثانیه.`;
      $('#gSum').innerHTML = [['پارت', job.partId], ['معتبر و ذخیره‌شده', records.length], ['کل تلاش‌ها', s.attempts], ['ردشده: بیش از حد شبیه', s.rejectedSimilar], ['ردشده در اعتبارسنجی', s.rejectedValidation], ['تکراری در دسته', s.rejectedBatchDup], ['برخورد با تاریخچه', s.collisionsHistory], ['برخورد با استثنا', s.collisionsExclusion]].map(([l, v]) => `<div class="stat"><b>${typeof v === 'number' ? nf(v) : esc(v)}</b><span>${l}</span></div>`).join('');
      const prev = (await ctx.store.all()).filter(r => r.brand === job.brand && r.model === job.model && r.partId !== job.partId && r.serial.length === records[0].serial.length).map(r => r.serial.slice(records[0].prefix.length));
      const pl = records[0].prefix.length, cur = records.map(r => r.serial.slice(pl)), mine = nearestDistanceHistogram(cur, cur, { same: true });
      const vs = prev.length ? nearestDistanceHistogram(cur, prev) : null, bk = h => Object.keys(h.hist).sort((a, b) => a - b).map(d => ({ label: `فاصله ${nf(d)}`, value: h.hist[d] }));
      $('#gSum').insertAdjacentHTML('beforeend', `<div class="wide"><h3>تفاوت ${job.partId}</h3>${vs ? `<p class="muted">نزدیک‌ترین سریال از پارت‌های قبلی (نمونه‌ی تقریبی؛ حداقل فاصله‌ی دیده‌شده: ${nf(vs.min)}):</p>${histogram(bk(vs))}` : '<p class="muted">این اولین پارت این مدل است؛ مقایسه‌ای با پارت قبلی وجود ندارد.</p>'}<p class="muted">نزدیک‌ترین هم‌پارتی (نمونه‌ی تقریبی؛ حداقل فاصله: ${nf(mine.min ?? 0)}):</p>${histogram(bk(mine))}</div>`);
      toast(`${job.partId}: ${nf(records.length)} سریال آزمایشی ساخته و در رجیستری محلی ذخیره شد.`); emit('data-changed');
    } catch (err) {
      $('#gBar').style.width = '0'; $('#gStat').textContent = '';
      const msg = err instanceof GenerationError ? `${err.code}: ${err.message}` : 'خطا: ' + err.message;
      $('#gSum').innerHTML = `<div class="banner bad wide">${esc(msg)}</div>`; toast(msg, true); emit('data-changed');
    } finally { $('#gGo').disabled = false; $('#gCancel').disabled = true; ac = null; }
  });
  $('#gCancel').addEventListener('click', () => ac && ac.abort());
  return { render() {} };
}
