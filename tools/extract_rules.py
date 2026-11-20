#!/usr/bin/env python3
"""مرحله ۱ (پایش پچ): استخراج قواعد از متن VBA ماژول‌های Brand_SerialCartKhan و Model_SerialCartKhan.
ورودی: tools/vba_dump.txt (خروجی رمزگشایی vbaProject.bin از BrandPAX.xlam)
خروجی: src/rules/patch-rules.js, docs/patch-rules.json, docs/vba-source/*.bas
هیچ قاعده‌ای دستی نوشته نمی‌شود؛ هر خط از متن VBA خوانده می‌شود و خط ناشناخته → UNRESOLVED."""
import re, json, hashlib, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
txt = open(os.path.join(root, 'tools/vba_dump.txt'), encoding='utf8').read()
parts = re.split(r'^={20} (\w+) \d+\n', txt, flags=re.M)
mods = {parts[i]: parts[i + 1] for i in range(1, len(parts), 2)}
TARGETS = [('Brand_SerialCartKhan', 'Module79'), ('Model_SerialCartKhan', 'Module3')]
out = {'source': 'BrandPAX.xlam › vbaProject.bin', 'sourceSha256_dump': hashlib.sha256(txt.encode()).hexdigest(), 'functions': {}, 'unresolvedLines': []}
os.makedirs(os.path.join(root, 'docs/vba-source'), exist_ok=True)
for fn, mod in TARGETS:
    src = mods[mod].split('\n')
    start = next(i for i, l in enumerate(src) if l.startswith('Function ' + fn))
    end = next(i for i in range(start, len(src)) if src[i].strip() == 'End Function')
    open(os.path.join(root, 'docs/vba-source/%s.%s.bas' % (mod, fn)), 'w', encoding='utf8').write('\n'.join(src[start:end + 1]) + '\n')
    slices = {}      # متغیر → (شروع, طول) از Mid(s, 1, k)
    rules, curL, seq = [], None, 0
    info = {'module': mod, 'initialN': None, 'returnsTrimmed': False}
    for i in range(start, end + 1):
        raw, ln = src[i], i + 1          # شماره خط نسبت به ابتدای ماژول
        t = raw.split("'")[0].strip()    # حذف توضیح
        if not t or t.startswith('Attribute') or t.startswith('Function') or t.startswith('Application.') or t == 'End Function':
            continue
        m = re.match(r'^(\w+) = Mid\(s, 1, (\d+)\)$', t)
        if m: slices[m.group(1)] = int(m.group(2)); continue
        if t == 's = Trim(Ceil)' or t == 'L = Len(s)': continue
        if t == 'n = ""': info['initialN'] = ''; continue
        if t.startswith(fn + ' = '): info['returnsTrimmed'] = 'Trim(n)' in t; continue
        m = re.match(r'^If L = (\d+) Then$', t)
        if m: curL = int(m.group(1)); continue
        if t == 'End If': curL = None; continue
        m = re.match(r'^If (\w+) = "([^"]*)" Then n = "([^"]*)"$', t)
        if m and m.group(1) in slices or (m and m.group(1) == 's'):
            var = m.group(1)
            width = 2 if var == 's' else slices[var]
            seq += 1
            rules.append({'seq': seq, 'line': ln, 'text': raw.strip(), 'length': curL, 'prefixChars': width, 'prefix': m.group(2), 'value': m.group(3)})
            continue
        m = re.match(r'^If Mid\((\w+), 1, (\d+)\) = "([^"]*)" Then n = "([^"]*)"$', t)
        if m and m.group(1) in slices:
            width = int(m.group(2)); seq += 1
            rules.append({'seq': seq, 'line': ln, 'text': raw.strip(), 'length': curL, 'prefixChars': width, 'prefix': m.group(3), 'value': m.group(4)})
            continue
        out['unresolvedLines'].append({'function': fn, 'line': ln, 'text': raw.strip()})
    # 's' در VBA بعد از محاسبه‌ی s2/s3 به ۲ نویسه کوتاه می‌شود (Mid(s,1,2)); بررسی کنید که واقعاً چنین است
    assert any(re.match(r'^s = Mid\(s, 1, 2\)$', src[i].strip()) for i in range(start, end)), 'فرض s=2 نویسه برقرار نیست'
    info['sliceVars'] = slices
    info['rules'] = rules
    out['functions'][fn] = info
js = '// تولیدشده خودکار توسط tools/extract_rules.py از BrandPAX.xlam. دستی ویرایش نکنید.\nexport default ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
open(os.path.join(root, 'src/rules/patch-rules.js'), 'w', encoding='utf8').write(js)
json.dump(out, open(os.path.join(root, 'docs/patch-rules.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
for fn, f in out['functions'].items(): print(fn, len(f['rules']), 'rules; lengths:', sorted({r['length'] for r in f['rules'] if r['length']}), 'global:', [r['prefix'] for r in f['rules'] if r['length'] is None])
print('UNRESOLVED lines:', out['unresolvedLines'])
