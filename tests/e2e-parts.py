import subprocess,time,json
from playwright.sync_api import sync_playwright
sp='/tmp/claude-0/-home-claude/c76f4d42-5768-514a-9500-d5f540fa8061/scratchpad/'
srv=subprocess.Popen(['python3','-m','http.server','8771'],cwd='/home/claude/pos-serial-generator',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
U='http://localhost:8771/index.html'
try:
 with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True,color_scheme='light')
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(U+'#generate');pg.wait_for_selector('#gBrand option',state='attached')
    pg.select_option('#gBrand','Newland');print('models',pg.eval_on_selector_all('#gModel option','e=>e.map(x=>x.textContent)'))
    pg.select_option('#gModel','SP600');print('info',pg.inner_text('#gInfo')[:140])
    print('div default',pg.eval_on_selector('#gDiv','e=>e.value'))
    ids=[]
    for i in range(3):
        pg.fill('#gQty','2000');pg.check('#gAck') if i==0 else None
        pg.click('#gGo');pg.wait_for_function("document.querySelector('#gStat').textContent.includes('انجام شد')",timeout=30000)
        ids.append(pg.inner_text('#gStat').split('|')[0].strip());time.sleep(.3)
        pg.wait_for_function("!document.querySelector('#gGo').disabled")
    print('parts',ids);pg.screenshot(path=sp+'shots/p-generate.png',full_page=True)
    print('sum',pg.inner_text('#gSum')[:200].replace('\n',' '))
    pg.evaluate("location.hash='parts'");pg.wait_for_selector('#ptT tbody tr [data-open]');time.sleep(.4)
    print('part rows',pg.eval_on_selector_all('#ptT tbody tr','r=>r.length'))
    pg.screenshot(path=sp+'shots/p-parts.png',full_page=True)
    pg.click('#ptT tbody tr:first-child [data-open]');pg.wait_for_selector('#ptRows tbody td.mono');time.sleep(.5)
    print('detail',pg.inner_text('#ptDetail h2'));print('kpis',pg.inner_text('#ptDetail .kpis').replace('\n',' '))
    pg.screenshot(path=sp+'shots/p-detail.png',full_page=True)
    with pg.expect_download() as d: pg.click('#ptRows [data-act=csv]')
    print('part csv',d.value.suggested_filename)
    # DB-level verification of diversity across all parts
    r=pg.evaluate("""async()=>{const {IdbStore}=await import('./src/database/idb-store.js');const {hamming}=await import('./src/generator/diversity.js');const s=new IdbStore();await s.init();
      const a=(await s.all()).filter(x=>x.model==='SP600');const by={};a.forEach(x=>(by[x.partId]??=[]).push(x.serial));
      const P=Object.keys(by).sort();let mn=99,cross=99;
      for(const k of P){const v=by[k];for(let i=0;i<v.length;i+=11)for(let j=0;j<v.length;j+=3){if(i!==j)mn=Math.min(mn,hamming(v[i],v[j]))}}
      for(let x=1;x<P.length;x++)for(const u of by[P[x]].filter((_,i)=>i%9===0))for(const w of by[P[0]].filter((_,i)=>i%4===0))cross=Math.min(cross,hamming(u,w));
      return {n:a.length,uniq:new Set(a.map(x=>x.serial)).size,parts:P,withinMin:mn,crossMin:cross,badSrc:a.filter(x=>x.ruleSource!=='USER_DECLARED').length,badLen:a.filter(x=>x.serial.length!==12||!x.serial.startsWith('J7')).length}}""")
    print('db',r)
    pg.evaluate("location.hash='overview'");time.sleep(.6);pg.screenshot(path=sp+'shots/p-overview.png',full_page=True)
    pg.evaluate("location.hash='rules'");time.sleep(.6);print('matrix cells',pg.eval_on_selector_all('.rc','e=>e.length'),'usr',pg.eval_on_selector_all('.rc.usr','e=>e.map(x=>x.textContent)'));pg.screenshot(path=sp+'shots/p-rules.png',full_page=True)
    pg.evaluate("location.hash='history'");time.sleep(.5);print('hist',pg.inner_text('#hjT tbody tr:first-child')[:120].replace('\n',' '))
    # dark + mobile
    pg.click('#themeBtn');pg.evaluate("location.hash='overview'");time.sleep(.5);pg.screenshot(path=sp+'shots/p-overview-dark.png',full_page=True)
    m=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);mp=m.new_page()
    mp.goto(U+'#overview');time.sleep(1.2)
    print('mobile overflow-x',mp.evaluate("document.documentElement.scrollWidth>innerWidth+1"))
    mp.screenshot(path=sp+'shots/p-m-overview.png',full_page=True)
    mp.goto(U+'#generate');time.sleep(.8);print('mobile overflow gen',mp.evaluate("document.documentElement.scrollWidth>innerWidth+1"))
    print('errors',errs)
finally: srv.terminate()
