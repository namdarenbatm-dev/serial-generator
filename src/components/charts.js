/* نمودارهای SVG بدون وابستگی. رنگ‌ها از متغیرهای CSS می‌آیند تا در حالت شب/روز درست باشند.
   رنگ تنها حامل معنا نیست: همه‌جا برچسب یا عدد کنار آن است. */
import { esc, nf } from '../utils/text.js';
export const SERIES = ['var(--blue)', 'var(--orange)', 'var(--leaf)', 'var(--c4)', 'var(--c5)', 'var(--red)', 'var(--c7)', 'var(--c8)'];
export const colorOf = i => SERIES[i % SERIES.length];

export function sparkline(values, { w = 120, h = 34, color = 'var(--blue)' } = {}) {
  if (!values.length) return '';
  const mx = Math.max(1, ...values), st = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values.map((v, i) => `${(values.length > 1 ? i * st : w / 2).toFixed(1)},${(h - 3 - (v / mx) * (h - 8)).toFixed(1)}`);
  const area = `0,${h} ${pts.join(' ')} ${w},${h}`;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="روند"><polygon points="${area}" fill="${color}" opacity=".14"/><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts[pts.length - 1].split(',')[0]}" cy="${pts[pts.length - 1].split(',')[1]}" r="3" fill="${color}"/></svg>`;
}
/** نمودار میله‌ای عمودی: items=[{label, value, color, sub}] */
export function columns(items, { h = 200, unit = '' } = {}) {
  if (!items.length) return '<p class="muted">داده‌ای نیست.</p>';
  const w = Math.max(320, items.length * 54), mx = Math.max(1, ...items.map(i => i.value)), pad = { t: 22, b: 40, l: 8, r: 8 }, bw = Math.min(34, (w - pad.l - pad.r) / items.length - 10);
  const grid = [0.25, 0.5, 0.75, 1].map(f => `<line x1="0" x2="${w}" y1="${pad.t + (h - pad.t - pad.b) * (1 - f)}" y2="${pad.t + (h - pad.t - pad.b) * (1 - f)}" class="gl"/>`).join('');
  const bars = items.map((it, i) => {
    const x = pad.l + (i + .5) * ((w - pad.l - pad.r) / items.length), bh = Math.max(2, (it.value / mx) * (h - pad.t - pad.b)), y = h - pad.b - bh;
    return `<g><title>${esc(it.label)}: ${nf(it.value)}${esc(unit)}${it.sub ? ' | ' + esc(it.sub) : ''}</title><rect x="${(x - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" rx="5" fill="${it.color || colorOf(i)}"/>
      <text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" class="cv" text-anchor="middle">${nf(it.value)}</text><text x="${x.toFixed(1)}" y="${h - 22}" class="cl" text-anchor="middle">${esc(it.label)}</text>${it.sub ? `<text x="${x.toFixed(1)}" y="${h - 8}" class="cs" text-anchor="middle">${esc(it.sub)}</text>` : ''}</g>`;
  }).join('');
  return `<div class="scrollx"><svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="نمودار ستونی">${grid}${bars}</svg></div>`;
}
/** نیم‌دایره‌ی درصد: pct بین ۰ و ۱. برای درصدهای بسیار کوچک حداقل یک خط مرئی رسم می‌شود. */
export function gauge(pct, { label = '', sub = '', color = 'var(--blue)' } = {}) {
  const p = Math.max(0, Math.min(1, pct)), R = 52, C = Math.PI * R, shown = p > 0 ? Math.max(p, 0.012) : 0;
  const txt = p === 0 ? '۰٪' : p < 0.0001 ? 'کمتر از ۰٫۰۱٪' : (p * 100).toLocaleString('fa-IR', { maximumFractionDigits: p < 0.01 ? 4 : 1 }) + '٪';
  return `<div class="gauge"><svg viewBox="0 0 130 78" role="img" aria-label="${esc(label)} ${txt}"><path d="M13 70 A52 52 0 0 1 117 70" fill="none" stroke="var(--line)" stroke-width="12" stroke-linecap="round"/>
    <path d="M13 70 A52 52 0 0 1 117 70" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C * shown).toFixed(2)} ${C.toFixed(2)}"/><text x="65" y="62" text-anchor="middle" class="gv">${txt}</text></svg>
    <b>${esc(label)}</b><span class="muted">${esc(sub)}</span></div>`;
}
export function donut(items, { size = 160, center = '' } = {}) {
  const tot = items.reduce((s, i) => s + i.value, 0); if (!tot) return '<p class="muted">داده‌ای نیست.</p>';
  const R = 56, r = 36, cx = 80, cy = 80; let a0 = -Math.PI / 2;
  const arcs = items.map((it, i) => {
    const frac = it.value / tot;
    if (frac === 1) { a0 = 0; return `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${it.color || colorOf(i)}" stroke-width="${R - r}"><title>${esc(it.label)}: ${nf(it.value)}</title></circle>`; }
    const a1 = a0 + frac * 2 * Math.PI - (frac === 1 ? 0.0001 : 0), large = frac > .5 ? 1 : 0;
    const p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
    const d = `M${p(R, a0)} A${R} ${R} 0 ${large} 1 ${p(R, a1)} L${p(r, a1)} A${r} ${r} 0 ${large} 0 ${p(r, a0)}Z`; a0 += frac * 2 * Math.PI;
    return `<path d="${d}" fill="${it.color || colorOf(i)}"><title>${esc(it.label)}: ${nf(it.value)} (${(frac * 100).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪)</title></path>`;
  }).join('');
  const leg = items.map((it, i) => `<li><i style="background:${it.color || colorOf(i)}"></i><span>${esc(it.label)}</span><b>${nf(it.value)}</b></li>`).join('');
  return `<div class="donut"><svg viewBox="0 0 160 160" width="${size}" height="${size}" role="img" aria-label="نمودار حلقه‌ای">${arcs}<text x="80" y="76" text-anchor="middle" class="gv">${nf(tot)}</text><text x="80" y="94" text-anchor="middle" class="cs">${esc(center)}</text></svg><ul class="legend">${leg}</ul></div>`;
}
/** هیستوگرام افقی: buckets=[{label, value, color}] */
export function histogram(buckets, { total = null } = {}) {
  const mx = Math.max(1, ...buckets.map(b => b.value)), tot = total ?? buckets.reduce((s, b) => s + b.value, 0);
  if (!tot) return '<p class="muted">داده‌ای نیست.</p>';
  return `<div class="hist">${buckets.map((b, i) => `<div class="hrow"><span>${esc(b.label)}</span><span class="trk"><i style="width:${Math.max(b.value ? 2 : 0, b.value / mx * 100)}%;background:${b.color || colorOf(i)}"></i></span><b>${nf(b.value)}</b><em>${(b.value / tot * 100).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪</em></div>`).join('')}</div>`;
}
/** نقشه‌ی حرارتی جایگاه × نویسه. اگر توزیع یکنواخت باشد همه‌ی خانه‌ها یک‌رنگ می‌شوند. */
export function heatmap({ rows, chars, max, expected }, { rowLabel = i => 'جایگاه ' + nf(i + 1) } = {}) {
  if (!rows.length) return '<p class="muted">داده‌ای نیست.</p>';
  const cw = chars.length > 12 ? 20 : 34, ch = 22, lw = 64, w = lw + chars.length * cw, h = 20 + rows.length * ch;
  const head = [...chars].map((c, i) => `<text x="${lw + i * cw + cw / 2}" y="13" text-anchor="middle" class="cs">${esc(c)}</text>`).join('');
  const cells = rows.map((r, y) => `<text x="${lw - 8}" y="${20 + y * ch + 15}" text-anchor="end" class="cs">${esc(rowLabel(y))}</text>` + r.map((v, x) => {
    const t = v / max; return `<rect x="${lw + x * cw + 1}" y="${20 + y * ch + 1}" width="${cw - 2}" height="${ch - 2}" rx="4" fill="var(--blue)" fill-opacity="${(0.08 + 0.92 * t).toFixed(3)}"><title>${esc(rowLabel(y))} | «${esc(chars[x])}»: ${nf(v)}</title></rect>${cw >= 30 ? `<text x="${lw + x * cw + cw / 2}" y="${20 + y * ch + 15}" text-anchor="middle" class="ct ${t > .55 ? 'on' : ''}">${nf(v)}</text>` : ''}`;
  }).join('')).join('');
  return `<div class="scrollx" dir="ltr"><svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="نقشه‌ی حرارتی توزیع نویسه‌ها در جایگاه‌ها">${head}${cells}</svg></div><p class="muted">میانگین مورد انتظار برای توزیع یکنواخت: ${nf(Math.round(expected))} در هر خانه. هرچه خانه‌ها یکنواخت‌تر، الگوی کمتری در سریال‌هاست.</p>`;
}
/** ماتریس قواعد: ردیف = طول سریال، خانه = پیشوندها با رنگ وضعیت */
export function rulesMatrix(reg, statusCls, statusFa) {
  const byLen = new Map(); reg.forEach(e => { if (!byLen.has(e.length)) byLen.set(e.length, []); byLen.get(e.length).push(e); });
  return `<div class="rmx">${[...byLen.keys()].sort((a, b) => a - b).map(L => `<div class="rrow"><b class="rl">طول ${nf(L)}</b><div class="rcells">${byLen.get(L).sort((a, b) => a.prefix.localeCompare(b.prefix)).map(e => `<span class="rc ${statusCls(e)}" title="${esc((e.brand || '—') + ' / ' + (e.model || '—') + ' | ' + statusFa(e))}">${esc(e.prefix)}<small>${esc(e.model || e.brand || '')}</small></span>`).join('')}</div></div>`).join('')}</div>`;
}
