from playwright.sync_api import sync_playwright
three=open('/tmp/node_modules/three/build/three.min.js','rb').read();jz=open('/tmp/node_modules/jszip/dist/jszip.min.js','rb').read()
src=open('/mnt/user-data/outputs/hexapod.html').read()
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1280,'height':800});pg.set_default_timeout(240000);errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/three.min.js',lambda r:r.fulfill(body=three,content_type='application/javascript'))
    pg.route('**/jszip.min.js',lambda r:r.fulfill(body=jz,content_type='application/javascript'))
    pg.set_content(src,wait_until='load');pg.wait_for_timeout(3000)
    for u in ['cm','in']:
        pg.evaluate(f"setUnits('{u}')");pg.wait_for_timeout(500)
        print(u,'|',pg.inner_text('#course').replace('\n',' / '))
        print(' btn:',pg.inner_text('#units'),'| scale:',pg.inner_text('#sclt'))
        print(' plan:',pg.evaluate("localParse('go to the basket and stop 8 in from it, then move 5 in back').map(stepText).join(' ; ')"))
    print(pg.evaluate("localParse('move 2 feet forward').map(stepText).join(' ; ')"))
    print(errs)
