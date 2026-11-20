/* پورت مستقیم Brand_SerialCartKhan و Model_SerialCartKhan از روی رجیستری استخراج‌شده.
   معناشناسی VBA که حفظ شده است:
   - Trim فقط فاصله (U+0020) را از دو سر برمی‌دارد (نه tab، نه نیم‌فاصله)
   - مقایسه‌ی رشته‌ها حساس به حروف بزرگ و کوچک است (هیچ Option Compare Text در ماژول‌ها نیست)
   - قانون‌های پشت‌سرهم: قانون بعدی نتیجه‌ی قبلی را بازنویسی می‌کند (آخرین مطابقت برنده است)
   - Mid(s,1,k) روی رشته‌ی کوتاه‌تر از k، همان رشته‌ی کوتاه را می‌دهد و هرگز با literal بلندتر برابر نمی‌شود
   - برند اگر هیچ قانونی جور نشود Empty برمی‌گرداند (اینجا null)، مدل رشته‌ی خالی "" */
import PATCH from '../rules/patch-rules.js';

export function trimVba(s) { return String(s).replace(/^ +| +$/g, ''); }

function run(fn, rawSerial, initial) {
  const s = trimVba(rawSerial), L = s.length;
  let n = initial;
  for (const r of PATCH.functions[fn].rules) {
    if (r.length !== null && r.length !== L) continue;
    if (s.substring(0, r.prefixChars) === r.prefix) n = r.value;
  }
  return n;
}
export function detectBrand(serial) { const n = run('Brand_SerialCartKhan', serial, null); return n; }
export function detectModel(serial) { return trimVba(run('Model_SerialCartKhan', serial, '')); }
export function detect(serial) { return { brand: detectBrand(serial), model: detectModel(serial) }; }
