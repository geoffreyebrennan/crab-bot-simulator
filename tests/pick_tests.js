// Stuck-detection tests (Phase 2, sub-steps 2.3 and 2.4.7): a truly blocked run must stop within ~5 s of the robot's last progress and name the obstacle;
// trips that merely have a prop in the way must route around it and arrive. (Boxed-in cases: route_fallback_tests.js. Hidden/late obstacles: route_stuck_tests.js.)

module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {HOLD,flipTest,localParse,HOLD,OB,c,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
// Pick-up tests (Phase 3, sub-step 3.1): every small object x both claws x start poses x terrain. A pick passes when the object is still in the claw
// 2 s after the step ends. Failures are binned by the phase they died in (0 approach, 1 line-up, 2 reach, 3 close, 4 lift).
//   node pick_tests.js [--html path] [--terrain 0,60] [--poses A,C,F] [--targets "red cube,teal ball"] [--claws left,right] [--verbose]
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const POSES={A:[0,0,0],C:[800,2100,180],F:[-900,400,-135],G:[1200,-900,120]};
const tl=String(arg('terrain','0')).split(',').map(Number),pl=String(arg('poses','C,F,G')).split(','),cl=String(arg('claws','left,right')).split(',');
const names=arg('targets',null)?String(arg('targets')).split(','):['red cube','teal ball','yellow cube','blue ball','green cube','pink ball'];
const verbose=process.argv.includes('--verbose'),PH=['approach','line-up','reach','close','lift'];
(async()=>{run(30);const rows=[];
 for(const T of tl){S.setT(T);run(30);
  for(const pn of pl)for(const n of names)for(const claw of cl){
   const [sx,sz,yd]=POSES[pn];globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=S.hT(sx,sz)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(+arg('settle',400));
   const e=S.ents().find(q=>q.name===n);if(Math.hypot(sx-e.x,sz-e.z)<600)continue;
   const k=claw==='left'?0:1;await S.runCommand('pick up the '+n+' with your '+claw+' claw');
   let t=0,ph=0,tph=[0,0,0,0,0];while(S.AUTO.on&&t<80*60){run(1);t++;const p=S.AUTO.s&&S.AUTO.s.ph;if(p!==undefined&&p!==null){ph=Math.max(ph,p);tph[p]=(tph[p]||0)+1;}}
   const msg=globalThis.__fail;run(120);const held=S.HOLD[k]===e.idx;
   rows.push({T,pn,n,claw,ok:held&&!msg,ph,msg,secs:+(t/60).toFixed(1),tph:tph.map(x=>+(x/60).toFixed(1))});
   const r=rows[rows.length-1];if(verbose||!r.ok)console.log((r.ok?'PASS ':'FAIL ')+`terrain ${T} pose ${pn} ${n}/${claw}: ${r.ok?'held':(msg||'not held after the step')+' [died in '+PH[ph]+']'} (${r.secs} s; phase s ${r.tph.join('/')})`);
  }}
 const tot=rows.length,ok=rows.filter(r=>r.ok).length;
 for(const T of tl){const R=rows.filter(r=>r.T===T);console.log(`terrain ${T} mm: ${R.filter(r=>r.ok).length}/${R.length}`);}
 const dead={};rows.filter(r=>!r.ok).forEach(r=>dead[PH[r.ph]]=(dead[PH[r.ph]]||0)+1);
 console.log(`picks: ${ok} of ${tot} held (${Math.round(100*ok/Math.max(1,tot))}%) | failures by phase: ${JSON.stringify(dead)}`);
 const by={};rows.forEach(r=>{const k=r.n+'/'+r.claw;by[k]=by[k]||[0,0];by[k][1]++;if(r.ok)by[k][0]++;});console.log('by object/claw: '+Object.entries(by).map(([k,v])=>k+' '+v[0]+'/'+v[1]).join(', '));
 const f=arg('out',null);if(f)require('fs').writeFileSync(f,JSON.stringify(rows));process.exit(0);})();
