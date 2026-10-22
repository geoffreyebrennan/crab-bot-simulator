// Basket (4.4): geometry, flat pad, hollow object physics, crab collision, names.
// (base harness from ramp_places_tests.js) Ramp places (4.3): names, parser, Claude plan checks, and walking to the ramp, its top and its far end.
// (base harness from ramp_tests2.js) Ramp tests 2 (4.2): sideways, off the edge, jump, turn, crouch, picking on the ramp.
// (base harness copied from ramp_tests.js) Ramp tests: the crab must walk up, over and down the ramp (flat and rough ground), in both directions, without flipping or stalling.
// Run: node ramp_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {BK,PR,inBasket,gripStep,OBN,localParse,normPlan,checkPlan,worldText,resolve,PLACES,OB,resetObjs,HOLD,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,RMP,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const ZR=S.RMP.z;
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;

async function trial(label,[sx,sz,yd],cmds,amp,okf,pre){
  globalThis.__fail='';S.Q.col=true;S.setT(amp);if(pre)pre();if(!pre)S.OB.forEach((b,k)=>{b.x0=OR[k][0];b.z0=OR[k][1];});S.reset();if(pre)pre();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15+S.hT(sx,sz)/1000;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
  let minUp=1,t=0,msg='';
  for(const cmd of cmds){await S.runCommand(cmd);let n=0;while(S.AUTO.on&&n<90*60){run(1);n++;t++;const up=new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y;minUp=Math.min(minUp,up);}if(S.AUTO.on){msg+=' [timeout]';}}
  run(90);const x=S.pos.x*1000,z=S.pos.z*1000,up=new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y;
  const ok=okf(x,z,S)&&up>.8&&minUp>.5&&(!globalThis.__fail||/ledge/.test(label))&&!msg;ok?pass++:fail++;
  console.log((ok?'PASS ':'FAIL ')+label.padEnd(44)+'| end ('+x.toFixed(0)+','+z.toFixed(0)+') y '+(S.pos.y*1000).toFixed(0)+' min up '+minUp.toFixed(2)+', '+(t/60).toFixed(0)+' s '+(globalThis.__fail||'')+msg);
}

const T=(ok,m)=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+m);};
const bp=()=>S.PR.find(p=>p.basket);
const nm=t=>{const e=S.resolve(t);return e?e.name:null;};
function settle(n){run(n);}
function drop(o,x,z,y,vx,vz){o.held=-1;o.p.set(x,y,z);o.v.set(vx||0,0,vz||0);}
(async()=>{run(30);
 for(const t of ['the basket','the brown basket','a bin','the bucket','tan basket','the container'])T(nm(t)==='brown basket','resolve "'+t+'" -> '+nm(t));
 T(nm('the red pillar')==='red pillar'&&nm('the pink ball')==='pink ball'&&nm('the brown thing')==='brown basket','other names unaffected');
 T(S.worldText().includes('- brown basket (open basket'),'world text lists the basket');
 for(const amp of [0,60]){
  S.setT(amp);S.reset();run(5);const p=bp();
  // flat pad
  let mx=0,mn=1e9;for(let dx=-120;dx<=120;dx+=20)for(let dz=-120;dz<=120;dz+=20){const h=S.hT(p.x+dx,p.z+dz);mx=Math.max(mx,h);mn=Math.min(mn,h);}
  T(mx-mn<1.5,'amp '+amp+': ground under the basket is flat ('+(mx-mn).toFixed(2)+' mm spread)');
  T(Math.abs(p.base-S.hT(p.x,p.z))<1e-6&&Math.abs(p.m.position.y-(p.base+p.h/2))<1e-6,'amp '+amp+': basket is seated on the ground');
  for(const [lab,k,dx,dz] of [['ball centre',1,0,0],['cube centre',0,0,0],['ball off-centre',3,55,-55],['cube off-centre',2,-55,55],['ball corner',5,60,60],['cube corner',4,-60,-60]]){
    const o=S.OB[k];S.reset();drop(o,p.x+dx,p.z+dz,p.base+160,0,0);run(240);
    T(S.inBasket(o)&&Math.abs(o.v.y)<1&&Math.hypot(o.v.x,o.v.z)<5&&o.p.y<p.base+6+o.r+2,'amp '+amp+': '+lab+' dropped from 8 cm above the rim lands inside and rests (y '+(o.p.y-p.base).toFixed(1)+' mm)');}
  // side hits
  for(const [lab,k,sx,sz,vx,vz] of [['ball rolling in from the west',1,-300,0,500,0],['cube sliding in from the north',0,0,300,0,-500],['ball rolling in from the east',3,300,20,-500,0]]){
    const o=S.OB[k];S.reset();drop(o,p.x+sx,p.z+sz,p.base+o.r+1,vx,vz);run(300);
    const inW=Math.abs(o.p.x-p.x)<81&&Math.abs(o.p.z-p.z)<81;
    T(!S.inBasket(o)&&Math.hypot(o.p.x-p.x,o.p.z-p.z)>81,'amp '+amp+': '+lab+' is stopped by the wall and stays outside');}
  // ball resting on the rim rolls off, never stuck inside the wall
  {const o=S.OB[1];S.reset();drop(o,p.x+78,p.z,p.base+80+o.r+2,0,0);run(300);const wall=Math.abs(o.p.x-p.x)<81&&Math.abs(o.p.x-p.x)>75&&o.p.y<p.base+80;
   T(!wall&&Math.abs(o.v.y)<1,'amp '+amp+': ball dropped on the rim rolls off it (x '+(o.p.x-p.x).toFixed(0)+', y '+(o.p.y-p.base).toFixed(0)+')');}
 }
 // the crab
 async function crab(label,pose,cmd,okf){globalThis.__fail='';S.setT(0);S.Q.col=true;S.reset();S.pos.x=pose[0]/1000;S.pos.z=pose[1]/1000;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),pose[2]*Math.PI/180);run(150);
   await S.runCommand(cmd);let t=0,mu=1;while(S.AUTO.on&&t<90*60){run(1);t++;mu=Math.min(mu,new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y);}run(60);
   const x=S.pos.x*1000,z=S.pos.z*1000,p=bp(),dB=Math.hypot(x-p.x,z-p.z);T(okf(x,z,dB)&&mu>.7,label.padEnd(44)+'| end ('+x.toFixed(0)+','+z.toFixed(0)+') '+dB.toFixed(0)+' mm from the basket, '+(t/60).toFixed(0)+' s '+(globalThis.__fail||''));}
 await crab('go to the basket from the start',[0,0,0],'go to the basket',(x,z,d)=>d>300&&d<480&&!globalThis.__fail);
 await crab('go to the basket from behind',[-650,-1700,90],'go to the basket',(x,z,d)=>d>300&&d<480&&!globalThis.__fail);
 await crab('go to the basket stop 5 cm away',[0,0,0],'go to the basket and stop 5 cm from it',(x,z,d)=>d>250&&d<420);
 await crab('pink ball then basket',[0,0,0],'go to the pink ball then go to the basket',(x,z,d)=>d>300&&d<480);
 await crab('walking straight into the basket is stopped',[-1150,-950,0],'move 60 cm forward',(x,z,d)=>d>190);
 await crab('red pillar still works',[0,0,0],'go to the red pillar',(x,z,d)=>Math.hypot(x-500,z)<420);
 console.log('basket 4.4:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
