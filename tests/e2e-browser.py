import subprocess,time,json,zipfile,re
from playwright.sync_api import sync_playwright
sp='/tmp/claude-0/-home-claude/c76f4d42-5768-514a-9500-d5f540fa8061/scratchpad/'
srv=subprocess.Popen(['python3','-m','http.server','8769'],cwd='/home/claude/pos-serial-generator',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
U='http://localhost:8769/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1200,'height':900},accept_downloads=True,color_scheme='light')
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(U+'#generate');pg.wait_for_selector('#gBrand option',state='attached');
    print('brands',pg.eval_on_selector_all('#gBrand option','e=>e.map(x=>x.textContent)'))
    pg.select_option('#gBrand','Pax');print('models',pg.eval_on_selector_all('#gModel option','e=>e.map(x=>x.textContent)'))
    pg.select_option('#gModel','D230');pg.fill('#gQty','500')
    pg.click('#gGo');time.sleep(.5);print('toast no-ack:',pg.inner_text('#toast'))
    pg.check('#gAck');pg.click('#gGo');pg.wait_for_selector('#gTable tbody tr td.mono',timeout=20000);time.sleep(.5)
    print('stat:',pg.inner_text('#gStat'));print('sum:',pg.inner_text('#gSum').replace('\n',' '))
    rows=pg.eval_on_selector_all('#gTable tbody tr','r=>r.map(x=>[...x.children].map(c=>c.textContent.trim()))')
    print('first rows',rows[:2]);pg.screenshot(path=sp+'shots/v7-generate.png')
    # export xlsx from table
    with pg.expect_download() as d: pg.click('#gTable [data-act=xlsx]')
    z=zipfile.ZipFile(d.value.path());print('xlsx',d.value.suggested_filename,z.read('xl/worksheets/sheet1.xml').decode().count('<row'),'rows')
    with pg.expect_download() as d: pg.click('#gTable [data-act=csv]')
    raw=open(d.value.path(),'rb').read();print('csv bytes',raw[:120])
    # reload -> persistence
    pg.reload();pg.wait_for_selector('#tabs button');pg.evaluate("location.hash='records'");pg.wait_for_selector('#rcT tbody tr td.mono',timeout=10000);time.sleep(.3)
    print('after reload records:',pg.inner_text('#rcInfo'))
    # second generation: no overlaps
    pg.evaluate("location.hash='generate'");pg.wait_for_selector('#gGo');pg.select_option('#gBrand','Pax');pg.select_option('#gModel','D230');pg.fill('#gQty','500');pg.check('#gAck');pg.click('#gGo');time.sleep(2)
    pg.evaluate("location.hash='records'");time.sleep(.6);print('after 2nd job:',pg.inner_text('#rcInfo'))
    # duplicates check in-browser vs IDB: take 3 records from DB + 1 new
    allr=pg.evaluate("""async()=>{const {IdbStore}=await import('./src/database/idb-store.js');const s=new IdbStore();await s.init();const a=await s.all();return {n:a.length,uniq:new Set(a.map(x=>x.serial)).size,bad:a.filter(x=>x.serial.length!==10||!x.serial.startsWith('23')).length,sample:a.slice(0,3).map(x=>x.serial)}}""")
    print('db',allr)
    pg.evaluate("location.hash='dups'");pg.fill('#dpT',"\n".join(allr['sample']+['2399999999',allr['sample'][0]]));pg.click('#dpGo');time.sleep(.5);print('dups:',pg.inner_text('#dpSum').replace('\n',' '))
    # concurrency across two tabs
    p2=ctx.new_page();p2.goto(U+'#generate');p2.wait_for_selector('#gBrand option',state='attached');p2.select_option('#gBrand','Pax');p2.select_option('#gModel','Q80');p2.fill('#gQty','3000');p2.check('#gAck')
    pg.evaluate("location.hash='generate'");pg.wait_for_selector('#gGo');pg.select_option('#gBrand','Pax');pg.select_option('#gModel','Q80');pg.fill('#gQty','3000');pg.check('#gAck')
    pg.click('#gGo');p2.click('#gGo');time.sleep(6)
    chk=pg.evaluate("""async()=>{const {IdbStore}=await import('./src/database/idb-store.js');const s=new IdbStore();await s.init();const a=(await s.all()).filter(x=>x.model==='Q80');return {n:a.length,uniq:new Set(a.map(x=>x.serial)).size}}""");print('two tabs Q80:',chk)
    # blocked combos can't be selected
    print('SP600 selectable?',pg.eval_on_selector_all('#gModel option','e=>e.map(x=>x.textContent)').count('SP600'))
    # diagnostics self-test
    pg.evaluate("location.hash='diag'");pg.click('#dgSelf');time.sleep(2);print('selftest:',pg.inner_text('#dgOut'))
    pg.screenshot(path=sp+'shots/v7-diag.png')
    # theme + mobile dark
    pg.click('#themeBtn');print('theme',pg.evaluate("document.documentElement.dataset.theme"))
    pg.evaluate("location.hash='rules'");time.sleep(.6);pg.screenshot(path=sp+'shots/v7-rules-dark.png')
    print('errors',errs)
    # offline
    pg.wait_for_function("navigator.serviceWorker.controller!==null || true");time.sleep(1)
    reg=pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r)");print('sw registered',reg)
    ctx.set_offline(True);pg.reload();pg.wait_for_selector('#tabs button',timeout=15000);print('offline ok; chip:',pg.inner_text('#netChip'))
    pg.evaluate("location.hash='generate'");time.sleep(.5);pg.select_option('#gBrand','Pax');pg.select_option('#gModel','S80');pg.fill('#gQty','50');pg.check('#gAck');pg.click('#gGo');time.sleep(1.5);print('offline gen:',pg.inner_text('#gStat'))
    m=ctx.new_page() 
    b.close()
srv.terminate()
