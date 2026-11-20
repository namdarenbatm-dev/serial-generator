import re,sys,json,random
txt=open(sys.argv[1],encoding='utf8').read()
secs=re.split(r'^={20} (\w+) \d+\n',txt,flags=re.M)
mods={secs[i]:secs[i+1] for i in range(1,len(secs),2)}
def run(src,ser):
    s=ser.strip(); L=len(s); s4=s[:4]; s3=s[:3]; s2=s[:2]; n=''; act=True; inblk=False
    for raw in src.split('\n'):
        t=raw.split("'")[0].strip()
        m=re.match(r'If L = (\d+) Then$',t)
        if m: inblk=True; act=(L==int(m.group(1))); continue
        if t=='End If': inblk=False; act=True; continue
        if not act: continue
        m=re.match(r'If s = "([^"]*)" Then n = "([^"]*)"',t)
        if m and s2==m.group(1): n=m.group(2); continue
        m=re.match(r'If s3 = "([^"]*)" Then n = "([^"]*)"',t)   # in Model_ s3 = first 4
        if m and s4==m.group(1): n=m.group(2); continue
        m=re.match(r'If Mid\(s2, 1, 3\) = "([^"]*)" Then n = "([^"]*)"',t)
        if m and s3==m.group(1): n=m.group(2)
    return n
pre=['30','37','38','26','29','32','2K','5C','51','55','72','54','2L','25','3L','3D','3C','7L','7A','68','2M','2N','76','9A','03','21','2D','36','3A','3E','3F','3G','3H','3J','3K','3M','3Q','3W','4A','4C','4D','4H','4K','4Z','5D','5F','6P','7D','88','89','8C','8E','D0','H0','H1','M0','P3','2A','23','2R','2P','2H','2Z','2Q','2E','2C','45','11','08','20','28','31','12','J7','124','0800','XX','99']
random.seed(7); AL='0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
cases=[]
for _ in range(40000):
    p=random.choice(pre); L=random.choice([5,6,7,8,9,10,11,12,13,17,18,20,22,24])
    ser=(p+''.join(random.choice(AL) for _ in range(30)))[:max(L,1)] if random.random()<.9 else ''.join(random.choice(AL) for _ in range(L))
    cases.append(ser)
out=[[c,run(mods['Module79'],c),run(mods['Module3'],c)] for c in cases]
json.dump(out,open(sys.argv[2],'w'))
print(len(out))
