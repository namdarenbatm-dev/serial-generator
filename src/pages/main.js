import { openStore } from '../services/engine.js';
import { $, toast } from '../components/ui.js';
import { mountOverview } from './overview.js'; import { mountGenerate } from './generate.js'; import { mountRules } from './rules.js'; import { mountRecords } from './records.js';
import { mountParts } from './parts.js';
import { mountDuplicates } from './duplicates.js'; import { mountIO } from './io.js'; import { mountHistory } from './history.js'; import { mountDiagnostics } from './diagnostics.js';

const ctx = { store: null, storeError: '' };
const PAGES = [['overview', 'نمای کلی', mountOverview], ['generate', 'تولید سریال', mountGenerate], ['parts', 'پارت‌ها', mountParts], ['rules', 'قواعد برند و مدل', mountRules], ['records', 'سریال‌های تولیدشده', mountRecords],
  ['dups', 'تشخیص تکرار', mountDuplicates], ['io', 'ورود و خروج', mountIO], ['history', 'تاریخچه', mountHistory], ['diag', 'تشخیص سیستم', mountDiagnostics]];
const mounted = {};

async function boot() {
  try { ctx.store = await openStore(); } catch (e) { ctx.store = null; ctx.storeError = e.message || String(e); }
  if (!ctx.store) { const b = document.createElement('div'); b.className = 'banner bad'; b.textContent = 'ذخیره‌ساز پایدار باز نشد، پس تولید غیرفعال است (بدون آن تضمین یکتایی دروغ می‌شود): ' + ctx.storeError; $('.banners').appendChild(b); }
  const tabs = $('#tabs'), main = $('#main');
  tabs.innerHTML = PAGES.map(([id, label]) => `<button role="tab" data-id="${id}" aria-selected="false">${label}</button>`).join('');
  PAGES.forEach(([id, , mount]) => { const s = document.createElement('section'); s.id = 'pg-' + id; s.hidden = true; s.setAttribute('role', 'tabpanel'); s.style.display = 'contents'; main.appendChild(s); });
  function show(id) {
    if (!PAGES.some(p => p[0] === id)) id = 'overview';
    PAGES.forEach(([pid, , mount]) => {
      const sec = $('#pg-' + pid), on = pid === id; sec.hidden = !on; sec.style.display = on ? 'contents' : 'none';
      if (on) { if (!mounted[pid]) { mounted[pid] = mount(sec, ctx); } mounted[pid].render(); }
    });
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    current = id;
  }
  let current = 'overview';
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { location.hash = b.dataset.id; } });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  document.addEventListener('data-changed', () => { mounted[current] && mounted[current].render(); });
  show(location.hash.slice(1) || 'overview');
}

// حالت شب/روز
function setTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('psg.theme', t); } catch {} document.querySelector('meta[name=theme-color]').setAttribute('content', t === 'dark' ? '#0F1720' : '#2A3440'); }
$('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
const net = () => { const c = $('#netChip'); c.textContent = navigator.onLine ? 'آنلاین' : 'آفلاین'; c.classList.toggle('off', !navigator.onLine); };
addEventListener('online', net); addEventListener('offline', net); net();

// PWA: ثبت SW و اعلان نسخه‌ی جدید
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;   // نصب اول نباید بارگذاری مجدد یا اعلان «نسخه‌ی جدید» بدهد
  navigator.serviceWorker.register('sw.js').then(reg => {
    const ask = w => { $('#updateBar').hidden = false; $('#updateBtn').onclick = () => w.postMessage({ type: 'SKIP_WAITING' }); };
    if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); }); });
  }).catch(() => {});
  let reloaded = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded && hadController) { reloaded = true; location.reload(); } });
}
boot().catch(e => toast('خطای راه‌اندازی: ' + e.message, true));
