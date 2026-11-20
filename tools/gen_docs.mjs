// docs/PATCH_RULES.md را از رجیستری زنده می‌سازد (بدون ویرایش دستی)
import fs from 'node:fs';
import PATCH from '../src/rules/patch-rules.js';
import { REGISTRY, STATUS_FA, combinations } from '../src/rules/registry.js';
const L = [];
L.push('# قواعد استخراج‌شده از پچ (PATCH_RULES)', '', `منبع: ${PATCH.source}`, '', '> تولیدشده خودکار با `tools/gen_docs.mjs` از `src/rules/patch-rules.js` (که خود با `tools/extract_rules.py` از متن VBA ساخته شده). دستی ویرایش نکنید.', '');
L.push('## توابع بررسی‌شده', '', '| تابع | ماژول | تعداد قاعده | خط تفسیرنشده |', '|---|---|---|---|');
for (const [fn, f] of Object.entries(PATCH.functions)) L.push(`| ${fn} | ${f.module} | ${f.rules.length} | ${PATCH.unresolvedLines.filter(u => u.function === fn).length} |`);
L.push('', 'توابع `Model_PartCartKhan` (شماره‌ی قطعه) و `x_Model_Noskheh` (نسخه) روی ورودی‌هایی غیر از سریال کار می‌کنند و خارج از دامنه‌اند. تابع‌های دیگر ماژول‌ها (فرم‌ها و ابزارهای SharePoint/بانک) به تشخیص سریال ربطی ندارند.', '');
L.push('## معناشناسی دقیق (مطابق متن VBA)', '',
 '- `s = Trim(Ceil)`: فقط فاصله‌ی U+0020 از دو سر حذف می‌شود، نه tab یا NBSP.', '- `L = Len(s)`؛ سپس ۲ نویسه‌ی اول (`s`)، ۳ نویسه‌ی اول (در Brand متغیر `s2`) و ۴ نویسه‌ی اول (در Model متغیر `s3`).',
 '- قانون‌ها پشت‌سرهم اجرا می‌شوند و **آخرین مطابقت برنده است** (بازنویسی). برند اگر چیزی جور نشود Empty (`null`)، مدل `""` است.',
 '- مقایسه حساس به حروف (در هیچ ماژولی `Option Compare Text` نیست): `2K` و `2k` دو کلید جدا هستند.', '- هیچ نرمال‌سازی (ارقام فارسی، تمام‌عرض، حذف نویسه‌ی کنترلی) در پچ نیست و این برنامه هم انجام نمی‌دهد.', '- قانون سراسری برند: ۳ نویسه‌ی اول برابر `124` ⇒ `Pax` برای هر طولی.', '');
L.push('## الگوهای مشتق‌شده و وضعیت', '', 'هر ردیف یک «الگو» (طول + پیشوند) است. وضعیت از اجرای خودِ دو تابع روی نمونه‌ی کاوشی همان الگو به دست آمده، نه از حدس.', '',
 '| شناسه | طول | پیشوند | برند | مدل | وضعیت | اولویت | مرجع VBA |', '|---|---|---|---|---|---|---|---|');
for (const e of REGISTRY) L.push(`| ${e.id} | ${e.length} | \`${e.prefix}\` | ${e.brand ?? '—'} | ${e.model ?? '—'} | ${STATUS_FA[e.status]}${e.subsumedBy ? ' (زیرمجموعه‌ی ' + e.subsumedBy + ')' : ''} | ${e.priority} | ${e.sources.map(s => `${s.function} ${s.module}:${s.line}`).join('<br>')} |`);
const c = combinations();
L.push('', '## ترکیب‌های برند/مدل', '', '| برند | مدل | در دسترس | الگوهای تأییدشده |', '|---|---|---|---|');
for (const x of c.sort((a, b) => Number(b.available) - Number(a.available))) L.push(`| ${x.brand ?? '—'} | ${x.model ?? '—'} | ${x.available ? 'بله' : 'خیر: ' + x.reasons.join(' ')} | ${x.templates.map(t => `${t.length}:${t.prefix}`).join(' ')} |`);
L.push('', '## موارد UNRESOLVED / مسدود', '', '- **L8:21** (`Pax` از تابع برند، ولی مدل «Verifone» از تابع مدل): ناسازگار؛ تولید مسدود.', '- الگوهای «فقط مدل» (مثل SP600 با `J7` و طول ۱۲، S80/S90/S800/S900 در طول ۷) برند ندارند ⇒ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. SP600 استثناست: مالک پروژه صریحاً اعلام کرده «SP600 = Newland» و این اعلام در لایه‌ی جدا `src/rules/declarations.js` ثبت شده و با وضعیت «اعلام‌شده توسط کاربر» علامت می‌خورد؛ در پچ نیست و وارد golden نمی‌شود.', '- الگوهای «فقط برند» مدل ندارند ⇒ تولید بر پایه‌ی مدل ممکن نیست.', '- بخش متغیر سریال (نویسه‌های بعد از پیشوند) در پچ تعریف نشده است ⇒ «تصمیم مهندسی خارج از پچ»، در UI صریحاً از کاربر گرفته می‌شود.', '');
fs.writeFileSync(new URL('../docs/PATCH_RULES.md', import.meta.url), L.join('\n'));
console.log('PATCH_RULES.md', L.length, 'lines');
