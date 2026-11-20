/* رجیستری قواعد: از قواعد استخراج‌شده‌ی پچ ساخته می‌شود و هیچ قاعده‌ی دستی ندارد.
   هر «ترکیب» (برند، مدل) فقط وقتی VERIFIED است که تابع برند و تابع مدل پچ، روی یک سریال نمونه‌ی همان الگو،
   هر دو جواب غیرخالی بدهند و با هم سازگار باشند. رابطه‌ی برند و مدل هرگز حدس زده نمی‌شود. */
import PATCH from './patch-rules.js';
import { detect } from '../core/vba.js';
import { declaredBrandOf } from './declarations.js';

export const FILL = '5';     // نویسه‌ی پرکننده‌ی نمونه‌ی کاوشی؛ فقط برای طبقه‌بندی الگو، نه تولید
export const STATUS = {
  VERIFIED: 'VERIFIED',
  BRAND_ONLY: 'BRAND_ONLY',     // پچ برند می‌دهد ولی مدل ندارد
  MODEL_ONLY: 'MODEL_ONLY',     // پچ مدل می‌دهد ولی برند ندارد
  CONFLICT: 'CONFLICT',         // مدل برگشتی نام برند دیگری است
  USER_DECLARED: 'USER_DECLARED', // پچ مدل می‌دهد؛ برند را کاربر اعلام کرده (نه پچ)
  UNRESOLVED: 'UNRESOLVED'
};
export const STATUS_FA = {
  VERIFIED: 'تأیید‌شده', BRAND_ONLY: 'فقط برند در پچ', MODEL_ONLY: 'فقط مدل در پچ', CONFLICT: 'ناسازگار در پچ', USER_DECLARED: 'اعلام‌شده توسط کاربر', UNRESOLVED: 'نامشخص'
};
export const REASON_FA = {
  BRAND_ONLY: 'پچ برای این الگو فقط برند برمی‌گرداند و مدل تعریف نکرده است؛ تولید بر پایه‌ی مدل ممکن نیست.',
  MODEL_ONLY: 'پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود.',
  CONFLICT: 'تابع برند و تابع مدل جواب‌های ناسازگار می‌دهند (مدل برگشتی نام برند دیگری است)؛ تولید مسدود است.'
};

const ok = e => e.status === STATUS.VERIFIED || e.status === STATUS.USER_DECLARED;
const fnRules = n => PATCH.functions[n].rules;
const brandNames = () => new Set(fnRules('Brand_SerialCartKhan').map(r => r.value));

/** همه‌ی الگوهای (طول، پیشوند) که پچ به آن‌ها اشاره می‌کند */
export function buildRegistry() {
  const lengths = new Set(), literals = new Map();   // literal → ارجاع‌ها
  for (const fn of Object.keys(PATCH.functions)) for (const r of fnRules(fn)) {
    if (r.length !== null) lengths.add(r.length);
    if (!literals.has(r.prefix)) literals.set(r.prefix, []);
    literals.get(r.prefix).push({ fn, module: PATCH.functions[fn].module, line: r.line, text: r.text, length: r.length, value: r.value });
  }
  const bn = brandNames(), entries = [];
  for (const [prefix, refs] of literals) for (const L of [...lengths].sort((a, b) => a - b)) {
    if (L < prefix.length) continue;
    const probe = prefix + FILL.repeat(L - prefix.length);
    const { brand, model } = detect(probe);
    if (!brand && !model) continue;
    const mine = refs.filter(r => r.length === null || r.length === L);
    let status, reason = null;
    if (brand && model) {
      if (bn.has(model) && model !== brand) { status = STATUS.CONFLICT; reason = REASON_FA.CONFLICT; }
      else status = STATUS.VERIFIED;
    } else if (brand) { status = STATUS.BRAND_ONLY; reason = REASON_FA.BRAND_ONLY; }
    else if (declaredBrandOf(model)) { status = STATUS.USER_DECLARED; reason = null; }
    else { status = STATUS.MODEL_ONLY; reason = REASON_FA.MODEL_ONLY; }
    const decl = status === STATUS.USER_DECLARED ? declaredBrandOf(model) : null;
    entries.push({
      id: `L${L}:${prefix}`, length: L, prefix, brand: decl ? decl.brand : (brand || null), model: model || null, status, reason, userDeclared: !!decl,
      note: decl ? decl.note : (status === STATUS.VERIFIED && model === brand) ? `پچ نام برند («${brand}») را به‌عنوان مدل برمی‌گرداند؛ همان مقدار حرفی پچ ثبت شد.` : null,
      priority: Math.max(...mine.map(r => PATCH.functions[r.fn].rules.find(x => x.line === r.line).seq)),
      sources: mine.map(r => ({ function: r.fn === 'Brand_SerialCartKhan' ? 'Brand_SerialCartKhan' : 'Model_SerialCartKhan', module: r.module, line: r.line, text: r.text }))
    });
  }
  // حذف الگوهای زیرمجموعه: «0800…» داخل «08…» هم‌ترکیب است و فضای تولید را دوبار نمی‌شمارد
  const ver = entries.filter(ok);
  for (const e of ver) e.subsumedBy = ver.find(o => o !== e && o.length === e.length && o.brand === e.brand && o.model === e.model && e.prefix.startsWith(o.prefix) && e.prefix !== o.prefix)?.id || null;
  entries.sort((a, b) => a.length - b.length || a.prefix.localeCompare(b.prefix));
  return entries;
}

export const REGISTRY = buildRegistry();

/** ترکیب‌های برند/مدل: فقط VERIFIED و USER_DECLARED ها برای تولید در دسترس‌اند؛ بقیه «غیرفعال» با دلیل */
export function combinations(reg = REGISTRY) {
  const map = new Map();
  for (const e of reg) {
    const key = `${e.brand || ''}\u0000${e.model || ''}`;
    if (!map.has(key)) map.set(key, { brand: e.brand, model: e.model, templates: [], statuses: new Set(), reasons: new Set() });
    const c = map.get(key);
    c.statuses.add(e.status); if (e.reason) c.reasons.add(e.reason);
    if (ok(e) && !e.subsumedBy) c.templates.push(e);
    if (e.userDeclared) c.userDeclared = true;
  }
  return [...map.values()].map(c => ({ brand: c.brand, model: c.model, templates: c.templates, available: c.templates.length > 0, userDeclared: !!c.userDeclared, source: c.userDeclared ? 'USER_DECLARED' : 'PATCH', reasons: [...c.reasons] }));
}
export function availableCombos(reg = REGISTRY) { return combinations(reg).filter(c => c.available); }
export function brands(reg = REGISTRY) { return [...new Set(availableCombos(reg).map(c => c.brand))].sort(); }
export function modelsOf(brand, reg = REGISTRY) { return availableCombos(reg).filter(c => c.brand === brand).map(c => c.model).sort(); }
export function findCombo(brand, model, reg = REGISTRY) { return availableCombos(reg).find(c => c.brand === brand && c.model === model) || null; }
export function capacity(combo, alphabetSize) { return combo.templates.reduce((s, t) => s + Math.pow(alphabetSize, t.length - t.prefix.length), 0); }
