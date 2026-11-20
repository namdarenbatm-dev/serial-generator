# معماری

**نوع برنامه:** PWA ایستا و کاملاً محلی (local-only). هیچ سرور، پایگاه‌داده‌ی ابری یا کلید محرمانه‌ای ندارد. این یک انتخاب آگاهانه است؛ پس **یکتایی فقط در رجیستری محلی همان مرورگر** تضمین می‌شود.

| لایه | مسیر | نقش |
|---|---|---|
| پچ‌کاوی | `tools/extract_rules.py` | استخراج قواعد از متن VBA ← `src/rules/patch-rules.js`، `docs/vba-source/*.bas` |
| هسته | `src/core/vba.js` | پورت `Brand_SerialCartKhan` و `Model_SerialCartKhan` (Trim فقط فاصله، حساس به حروف، آخرین مطابقت برنده) |
| قواعد | `src/rules/registry.js` | رجیستری قابل‌خواندن‌توسط‌ماشین؛ ترکیب‌ها فقط وقتی VERIFIED که هر دو تابع پچ هم‌نظر باشند |
| اعتبارسنج | `src/validator/validator.js` | طول، پیشوند، برند، مدل، تکراری؛ وضعیت و توضیح فارسی |
| تولید | `src/generator/generator.js` | کاندید ← اعتبارسنجی با پچ ← حذف تکراری دسته ← رزرو اتمیک ← تأیید یا بازگردانی کامل |
| ذخیره‌ساز | `src/database/idb-store.js` (+ `memory-store.js` برای تست) | IndexedDB با کلید یکتای `serial` |
| سرویس | `src/services/engine.js` | قفل بین‌تبی Web Locks + تولید |
| UI | `src/pages/*`, `src/components/*` | ۸ بخش: نمای کلی، تولید، قواعد، سریال‌ها، تکرار، ورود/خروج، تاریخچه، تشخیص |

## مدل داده (IndexedDB: `pos-serial-generator` v1)
- `serials` (کلید `serial`، شاخص `byJob`, `byModel`): `serial, brand, model, ruleId, jobId, createdAt, validation, classification='TEST_DATA', uniquenessScope='LOCAL_REGISTRY', status: reserved|committed, length, prefix`
- `exclusions` (کلید `serial`): `serial, list, addedAt`
- `jobs` (کلید `id`): پارامترها، آمار تلاش/برخورد، وضعیت (`done|failed|cancelled|running`)
- `audit` (autoIncrement): هر شروع/پایان/شکست/پاک‌سازی

نگاشت به موجودیت‌های پیشنهادی پرامپت: `brands/models/patch_rules` ← رجیستری کد (فقط‌خواندنی، از VBA)، `generation_jobs` ← `jobs`، `generated_serials` ← `serials`، `serial_reservations` ← وضعیت `reserved`، `exclusion_lists` ← `exclusions`، `audit_logs` ← `audit`.

## استراتژی یکتایی (Zero-Duplicate)
1. **دسته:** `Set` درون‌حافظه در حین تولید.
2. **تاریخچه و استثنا:** هر دسته‌ی ≤۱۰۰۰ تایی در **یک تراکنش readwrite** روی `serials` و `exclusions`: ابتدا `exclusions.get`، سپس `serials.add`. اگر کلید موجود باشد، `ConstraintError` می‌دهد و آن سریال «برخورد» حساب می‌شود (جایگزین ساخته می‌شود، سریال هرگز دستکاری نمی‌شود).
3. **رزرو و تأیید:** سریال‌ها اول `reserved` می‌شوند؛ فقط پس از بازبینی نهایی (اعتبارسنجی مجدد همه) `commitJob` آن‌ها را `committed` می‌کند. لغو، خطا یا نرسیدن به تعداد ⇒ `rollbackJob` همه‌ی رزروهای آن تولید را حذف می‌کند (همه یا هیچ).
4. **همزمانی:** `navigator.locks` (`pos-serial-generate`) تولیدها را بین تب‌ها پشت‌سرهم می‌کند؛ حتی بدون قفل، قید یکتای IndexedDB مانع تکرار است.
5. **سقف تلاش:** `quantity×20+2000`؛ پس از آن `GENERATION_EXHAUSTED` و بازگردانی کامل.
6. **هویت یکتایی:** `Trim` فقط فاصله، **حساس به حروف**، بدون هیچ نرمال‌سازی دیگر (مثل VBA).
7. **اگر IndexedDB باز نشود،** تولید غیرفعال می‌شود (بدون آن ادعای یکتایی دروغ است).

## دامنه‌ی یکتایی
`LOCAL_REGISTRY`: همین مرورگر + همین پروفایل + همین دستگاه. پاک‌کردن داده‌ی سایت یا حذف دستی «سریال‌ها» این تضمین را نسبت به سریال‌های حذف‌شده از بین می‌برد (قبل از حذف تأیید گرفته می‌شود). یکتایی سراسری نیازمند رجیستری مرکزی مشترک است که این نسخه ندارد.

## امنیت
CSV/Excel با سقف ۸ مگابایت و ۵۰۰٬۰۰۰ ردیف خوانده می‌شود؛ CSV خروجی فرمول‌ها را خنثی می‌کند؛ هیچ کلیدی در کد نیست؛ هر حذف تأیید می‌خواهد؛ هیچ بازنویسی بی‌صدا نیست.
