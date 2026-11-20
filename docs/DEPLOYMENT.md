# استقرار

برنامه فایل‌های ایستا است (بدون bundler/build). هر هاستینگ **HTTPS** کافی است (نصب PWA و Service Worker به HTTPS یا localhost نیاز دارند).

```bash
# اجرای محلی
cd pos-serial-generator && python3 -m http.server 8080     # یا هر سرور ایستا
# باز کردن http://localhost:8080
# آزمون‌ها
node --test "tests/**/*.test.js"        # Node 22
python3 tests/e2e-browser.py            # Playwright + Chrome (اختیاری)
```

بازتولید قواعد و مجموعه‌ی طلایی: `python3 tools/extract_rules.py && python3 tools/gen_golden.py && node tools/gen_docs.mjs` (ورودی: `tools/vba_dump.txt`).

نسخه‌دهی کش: ثابت `CACHE` در `sw.js` را با هر انتشار تغییر دهید؛ کاربران بنر «نسخه‌ی جدید آماده است» را می‌بینند.

**وضعیت استقرار تولیدی: BLOCKED / NOT DEPLOYED.** در این گفتگو هیچ استقرار عمومی انجام یا تأیید نشد (کاربر استقرار روی Vercel را نخواست؛ حساب متصل هم متعلق به ایمیلی دیگر بود). پس آدرس تولیدی و مخزن وجود ندارد.
