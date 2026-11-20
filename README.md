# POS Serial Generator

مولد **داده‌ی آزمایشی** سریال کارتخوان بر پایه‌ی قواعد **تشخیص** پچ `BrandPAX.xlam`. (پچ قاعده‌ی تخصیص ندارد؛ جزئیات در `docs/GENERATION_LOGIC.md`.)

- اجرا: `python3 -m http.server 8080` و باز کردن `http://localhost:8080`
- آزمون: `node --test "tests/**/*.test.js"`
- مستندات: `docs/` (قواعد، معماری، منطق تولید، گزارش آزمون، استقرار)
