#!/usr/bin/env python3
"""src/utils/legacy-io.js را از هسته‌ی I/O پروژه‌ی Barcode POS می‌سازد (خواندن XLSX/CSV با inflate خالص JS، نوشتن XLSX)."""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open('/home/claude/serial-brand-pwa/core.js', encoding='utf8').read()
src = src.replace('(function (root) {', 'const __root = {};\n(function (root) {', 1)
src = src.replace('})(typeof self !== \'undefined\' ? self : this);', '})(__root);\nexport const IO = __root.SBCore;\n', 1)
assert 'export const IO' in src and 'const __root' in src
open(os.path.join(root, 'src/utils/legacy-io.js'), 'w', encoding='utf8').write('/* تولیدشده با tools/build_io.py؛ دستی ویرایش نکنید. فقط توابع I/O استفاده می‌شوند، نه منطق برند Barcode POS. */\n' + src)
