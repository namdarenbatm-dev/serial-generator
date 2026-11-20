#!/usr/bin/env python3
"""مجموعه‌ی طلایی: خروجی «اجرای مفسر» روی متن اصلی VBA (tools/vba_dump.txt) برای هزاران ورودی.
توجه صادقانه: Excel/VBA واقعی روی این سیستم در دسترس نیست. مفسر، خطوط If همان توابع را اجرا می‌کند
(نه جدول بازنویسی‌شده)، ولی اجرای VBA اصلی نیست؛ پس برابری با VBA واقعی «تأیید‌نشده» (NOT VERIFIED) است."""
import re, json, random, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
txt = open(os.path.join(root, 'tools/vba_dump.txt'), encoding='utf8').read()
secs = re.split(r'^={20} (\w+) \d+\n', txt, flags=re.M)
mods = {secs[i]: secs[i + 1] for i in range(1, len(secs), 2)}
def run(fn_name, src, ser):
    start = src.index('Function ' + fn_name); body = src[start:].split('\nEnd Function')[0].split('\n')
    s = ser.strip(' ')                      # Trim در VBA فقط فاصله را حذف می‌کند
    L = len(s); s4 = s[:4]; s3 = s[:3]; s2 = s[:2]; n = None if fn_name.startswith('Brand') else ''
    brand = fn_name.startswith('Brand'); act = True
    for raw in body:
        t = raw.split("'")[0].strip()
        m = re.match(r'If L = (\d+) Then$', t)
        if m: act = (L == int(m.group(1))); continue
        if t == 'End If': act = True; continue
        if not act: continue
        m = re.match(r'If s = "([^"]*)" Then n = "([^"]*)"', t)
        if m and s2 == m.group(1): n = m.group(2); continue
        m = re.match(r'If s3 = "([^"]*)" Then n = "([^"]*)"', t)       # در Model: ۴ نویسه
        if m and s4 == m.group(1): n = m.group(2); continue
        m = re.match(r'If Mid\(s2, 1, 3\) = "([^"]*)" Then n = "([^"]*)"', t)
        if m and s3 == m.group(1): n = m.group(2)
    return n.strip(' ') if n is not None and not brand else n
# توجه: در Brand متغیر s2 سه نویسه و در Model متغیر s3 چهار نویسه است (مطابق استخراج). مفسر Brand فقط s و Mid(s2,1,3) را دارد.
pats = json.load(open(os.path.join(root, 'docs/patch-rules.json'), encoding='utf8'))
lits = sorted({r['prefix'] for f in pats['functions'].values() for r in f['rules']})
lens = sorted({r['length'] for f in pats['functions'].values() for r in f['rules'] if r['length']} | {5, 6, 9, 13, 24})
random.seed(20261114); AL = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz -./'
cases = []
for p in lits:
    for L in lens:
        if L < len(p): continue
        for k in range(8):
            fill = ''.join(random.choice('0123456789' if k < 5 else AL) for _ in range(L - len(p)))
            cases.append(p + fill)
cases += ['', ' ', '  2331439294', '2331439294  ', '\t2331439294', '2331439294\t', '2331439294 ', '2k123456', '2K123456', '2l123456', '2L123456', 'x', '12', '124', '0800', '08', '23', '1245555555', '12455555', '124' + '5' * 30, '0800000000', '0899999999', '٢٣٣١٤٣٩٢٩٤', '２３３１４３９２９４']
for _ in range(30000):
    L = random.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 18, 20, 22, 25]); p = random.choice(lits + ['ZZ', '99', 'xx'])
    cases.append((p + ''.join(random.choice(AL) for _ in range(30)))[:L] if random.random() < .85 else ''.join(random.choice(AL) for _ in range(L)))
cases = list(dict.fromkeys(cases))
out = [[c, run('Brand_SerialCartKhan', mods['Module79'], c), run('Model_SerialCartKhan', mods['Module3'], c)] for c in cases]
json.dump({'generatedBy': 'tools/gen_golden.py (VBA-source interpreter; NOT real VBA runtime)', 'cases': out}, open(os.path.join(root, 'tests/golden/golden.json'), 'w', encoding='utf8'), ensure_ascii=False)
print(len(out), 'golden cases;', sum(1 for _, b, m in out if b), 'with brand;', sum(1 for _, b, m in out if m), 'with model')
