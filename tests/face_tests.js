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
const S=new Function(...Object.keys(g),code+';return {flipTest,localParse,HOLD,OB,c,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
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
const TERR=String(arg('terrain','0,60')).split(',').map(Number),VERB=arg('verb','face the');
(async()=>{run(30);let ok=0,n=0;const bad=[],ts=[],dr=[],errs=[];
 for(const amp of TERR){S.setT(amp);run(30);
  for(const [pn,[sx,sz,yd]] of Object.entries(POSES))for(const e0 of S.ents()){
   globalThis.__fail='';S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=S.hT(sx,sz)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
   const e=S.ents().find(q=>q.name===e0.name);if(Math.hypot(sx-e.x,sz-e.z)<300)continue;
   const p0=[S.pos.x*1000,S.pos.z*1000];await S.runCommand(VERB+' '+e.name);let t=0;while(S.AUTO.on&&t<40*60){run(1);t++;}run(90);
   const[xb,yb]=S.relXY(e.x,e.z),br=Math.abs(Math.atan2(yb,xb))*180/Math.PI,drift=Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]),pass=!globalThis.__fail&&br<=3&&drift<250;n++;if(pass){ok++;ts.push(t/60);}dr.push(drift);
   if(!pass)bad.push(`terrain ${amp} pose ${pn} ${e.name}: bearing ${br.toFixed(1)} deg, drift ${Math.round(drift)} mm, ${(t/60).toFixed(1)} s${globalThis.__fail?' | '+globalThis.__fail:''}`);}}
 bad.forEach(b=>console.log('FAIL '+b));ts.sort((a,b)=>a-b);dr.sort((a,b)=>a-b);
 console.log('face:',ok,'of',n,'within 3 degrees | median time',(ts[ts.length>>1]||0).toFixed(1),'s, slowest',(ts[ts.length-1]||0).toFixed(1),'s | median drift',Math.round(dr[dr.length>>1]),'mm, max',Math.round(dr[dr.length-1]),'mm');process.exit(ok===n?0:1);})();