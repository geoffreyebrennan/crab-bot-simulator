# Browser regression (Phase 2, sub-step 2.4.9): loads the page in headless Chromium, types commands into the command bar, checks focus, errors, layout.
# Run: python3 browser_check.py [html path]   (needs playwright + three/jszip in /tmp/node_modules)
import sys,re,time
from playwright.sync_api import sync_playwright
HTML=sys.argv[1] if len(sys.argv)>1 else '/mnt/user-data/outputs/hexapod.html'
OUT=sys.argv[2] if len(sys.argv)>2 else '/tmp'
three=open('/tmp/node_modules/three/build/three.min.js','rb').read();jz=open('/tmp/node_modules/jszip/dist/jszip.min.js','rb').read()
src=open(HTML).read()
res=[];errs=[]
def chk(ok,msg):res.append((ok,msg));print(('PASS ' if ok else 'FAIL ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome' if __import__('os').path.exists('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') else None,args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    VIEWS=[('desktop',1280,800),('phone',390,780),('landscape',780,380)]
    if len(sys.argv)>3:VIEWS=[v for v in VIEWS if v[0]==sys.argv[3]]
    for name,vw,vh in VIEWS:
        pg=b.new_page(viewport={'width':vw,'height':vh});errs.clear();pg.set_default_timeout(240000)
        pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        pg.route('**/three.min.js',lambda r:r.fulfill(body=three,content_type='application/javascript'))
        pg.route('**/jszip.min.js',lambda r:r.fulfill(body=jz,content_type='application/javascript'))
        pg.set_content(src,wait_until='load');pg.wait_for_timeout(2500)
        chk(not errs,name+': no page errors '+(str(errs[:2]) if errs else ''))
        # command bar: focus must survive clicks elsewhere in the page and typing must reach the box
        pg.click('#cmd');pg.keyboard.type('go to the red pillar');pg.mouse.click(vw//2,vh//3);pg.wait_for_timeout(200)
        pg.click('#cmd');pg.keyboard.press('End');pg.keyboard.type(' ');v=pg.input_value('#cmd')
        chk(v.strip()=='go to the red pillar',name+': text typed in the command box survives ('+repr(v)+')')
        # keyboard W must not move the robot while typing in the box
        # layout: command bar must not overlap the d-pad or run off the screen
        r=pg.evaluate('''()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return [b.left,b.top,b.right,b.bottom,getComputedStyle(e).display]};return {cbar:q('#cbar'),pad:q('#pad'),run:q('#run'),cmd:q('#cmd'),w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth}}''')
        cb,pd=r['cbar'],r['pad']
        chk(cb and cb[0]>=-1 and cb[2]<=r['w']+1,name+': command bar inside the screen width '+str([round(x) for x in cb[:4]]))
        chk(r['sw']<=r['w']+1,name+': no horizontal page scroll')
        if pd and pd[4]!='none':
            ov=not(cb[2]<=pd[0] or cb[0]>=pd[2] or cb[3]<=pd[1] or cb[1]>=pd[3]);chk(not ov,name+': command bar does not overlap the d-pad')
        # run a go-to command through the UI and watch the robot get there
        pg.fill('#cmd','go to the pink ball');pg.click('#run');pg.wait_for_timeout(500)
        txt=pg.inner_text('#cst')+' '+pg.inner_text('#gr')
        chk(re.search(r'pink ball',txt,re.I) is not None,name+': plan shows the pink ball ('+txt.strip().replace('\n',' | ')[:90]+')')
        t0=time.time()
        while time.time()-t0<90 and pg.evaluate('AUTO.on'):pg.wait_for_timeout(500)
        done=not pg.evaluate('AUTO.on');d=pg.evaluate("(()=>{const e=ents().find(q=>q.name==='pink ball');return Math.hypot(...relXY(e.x,e.z))})()")
        st=pg.inner_text('#cst').strip().replace('\n',' | ')
        chk(done and d<=290,name+': robot reached the pink ball through the UI (finished '+str(done)+', '+str(round(d))+' mm away, '+str(round(time.time()-t0))+' s real time)')
        pg.screenshot(path=f'{OUT}/shot_{name}.png')
        pg.close()
    b.close()
print('\nbrowser check:',sum(1 for o,_ in res if o),'passed,',sum(1 for o,_ in res if not o),'failed')
sys.exit(1 if any(not o for o,_ in res) else 0)
