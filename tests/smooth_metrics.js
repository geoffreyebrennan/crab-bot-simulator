// Driving smoothness (Phase 2, sub-step 2.7): command smoothness along go-to trips. Run: node smooth_metrics.js [--poses A,C,F] [--targets a,b] [--json out.json]
// Run: node stuck_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {c,planRoute,PR,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const out=[];
const chk=(ok,msg)=>{if(ok)pass++;else{fail++;out.push('FAIL '+msg);}};
async function trial(label,[sx,sz,yd],cmd,expect){
  globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
  const e=expect.target?S.ents().find(q=>q.name===expect.target):null;
  await S.runCommand(cmd);let t=0,best=1e9,tBest=0,p0=[S.pos.x*1000,S.pos.z*1000],tMove=0;
  while(S.AUTO.on&&t<90*60){run(1);t++;const d=e?Math.hypot(S.pos.x*1000-e.x,S.pos.z*1000-e.z):Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);
    if(expect.target?d<best-25:d>best+25-1e9&&false){}
    if(expect.target){if(d<best-25){best=d;tBest=t;}}else{const m=Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);if(m>best||best===1e9){best=m;}if(m>tMove+25){tMove=m;tBest=t;}}}
  const msg=globalThis.__fail,since=(t-tBest)/60;
  chk(!!msg,label+': blocked run should end with a message (ran '+(t/60).toFixed(1)+' s, AUTO.on='+S.AUTO.on+')');
  if(msg){chk(msg.includes(expect.blocker),label+': message should name "'+expect.blocker+'" -> '+JSON.stringify(msg));
    chk(since<=6.5,label+': should stop within ~5 s of the last progress, took '+since.toFixed(1)+' s');}
  console.log((msg&&msg.includes(expect.blocker)&&since<=6.5?'PASS ':'FAIL ')+label.padEnd(44)+'| stopped '+since.toFixed(1)+' s after last progress | "'+(msg||'(no message, '+(t/60).toFixed(0)+' s)')+'"');
}


const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const POSES={A:[0,0,0],B:[-1200,-900,0],C:[800,1400,180],D:[-200,-1500,90],E:[200,-250,270],F:[-900,400,-135]};
const pl=String(arg('poses','A,C,F')).split(',');
(async()=>{run(30);
  const all=S.ents().map(e=>e.name);const tl=arg('targets',null)?String(arg('targets')).split(','):all.filter(n=>!/sky blue/.test(n));
  const rows=[];
  for(const pn of pl)for(const tn of tl){
    const [sx,sz,yd]=POSES[pn];globalThis.__fail='';S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
    const e=S.ents().find(q=>q.name===tn);if(Math.hypot(sx-e.x,sz-e.z)<600)continue;const stop=e.small?250:360;
    await S.runCommand('go to the '+tn);let t=0,tMove=-1,lvx=0,lw=0,jx=0,jw=0,nj=0,slowT=0,moveT=0,stopgo=0,fast=false,peakA=0,peakAw=0,lx=S.pos.x*1000,lz=S.pos.z*1000,sp=0,hist=[];
    while(S.AUTO.on&&t<90*60){run(1);t++;if(!S.AUTO.on)break;const dt=1/60,vx=S.c.vx,w=S.c.w;
      if(t%15===0){const x=S.pos.x*1000,z=S.pos.z*1000;sp=Math.hypot(x-lx,z-lz)/.25;lx=x;lz=z;hist.push(sp);}
      const ax=Math.abs(vx-lvx)/dt,aw=Math.abs(w-lw)/dt;peakA=Math.max(peakA,ax);peakAw=Math.max(peakAw,aw);jx+=Math.abs(vx-lvx);jw+=Math.abs(w-lw);nj++;lvx=vx;lw=w;
      if(tMove<0&&vx>60)tMove=t/60;
      if(tMove>=0){moveT++;const d=Math.hypot(...S.relXY(e.x,e.z));if(vx<60&&d>stop+250)slowT++;if(fast&&vx<30&&d>stop+120){stopgo++;fast=false;}if(vx>100)fast=true;}}
    run(60);const [xb,yb]=S.relXY(e.x,e.z),d=Math.hypot(xb,yb),br=Math.abs(Math.atan2(yb,xb))*180/Math.PI,ok=!globalThis.__fail&&d<=stop+45&&br<12;
    rows.push({pose:pn,target:tn,ok,t:+(t/60).toFixed(1),startDelay:+tMove.toFixed(1),midSlowFrac:+(slowT/Math.max(1,moveT)).toFixed(2),stopGo:stopgo,meanDvx:+(jx/nj*60).toFixed(0),peakAx:Math.round(peakA),peakAw:+peakAw.toFixed(1)});
    const R=rows[rows.length-1];console.log((ok?'OK  ':'FAIL')+' '+pn+'->'+tn.padEnd(14)+' t '+String(R.t).padStart(5)+' | start delay '+String(R.startDelay).padStart(4)+' s | mid-route slow '+(R.midSlowFrac*100).toFixed(0).padStart(3)+'% | stop-go '+R.stopGo+' | mean |dvx/dt| '+String(R.meanDvx).padStart(4)+' | peak '+String(R.peakAx).padStart(5)+' mm/s2, '+R.peakAw+' rad/s2');}
  const ok=rows.filter(r=>r.ok),m=k=>(ok.reduce((a,r)=>a+r[k],0)/Math.max(1,ok.length));
  console.log('\n'+ok.length+'/'+rows.length+' arrived | mean time '+m('t').toFixed(1)+' s | start delay '+m('startDelay').toFixed(1)+' s | mid-route slow '+(m('midSlowFrac')*100).toFixed(0)+'% | stop-go '+m('stopGo').toFixed(2)+' | mean |dvx/dt| '+m('meanDvx').toFixed(0)+' | mean peak accel '+m('peakAx').toFixed(0)+' mm/s2');
  if(arg('json',null))require('fs').writeFileSync(arg('json'),JSON.stringify(rows,null,1));process.exit(0);})();
