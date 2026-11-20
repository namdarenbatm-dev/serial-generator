import { esc } from '../utils/text.js';
export const $ = (s, r = document) => r.querySelector(s);
let tt;
export function toast(msg, bad = false) {
  const el = $('#toast'); el.textContent = msg; el.className = 'toast' + (bad ? ' bad' : ''); el.hidden = false;
  clearTimeout(tt); tt = setTimeout(() => { el.hidden = true; }, bad ? 7000 : 4000);
}
export function confirmDialog(message, okLabel = 'تأیید', title = 'تأیید عملیات') {
  const d = $('#confirmDlg'); $('#cdTitle').textContent = title; $('#cdMsg').textContent = message; $('#cdOk').textContent = okLabel;
  return new Promise(res => { d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true }); d.returnValue = 'cancel'; d.showModal(); });
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fallback */ }
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); return ok;
}
export const pill = (cls, text) => `<span class="pill ${cls}">${esc(text)}</span>`;
export const emit = name => document.dispatchEvent(new CustomEvent(name));
