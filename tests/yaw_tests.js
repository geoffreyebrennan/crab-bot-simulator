// Basket count (4.5): the in-basket count, world text and reset.
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
const S=new Function(...Object.keys(g),code+';return {c,qdS,cpts,ln,P,NL,ang,DEP,BK,PR,inBasket,gripStep,OBN,localParse,normPlan,checkPlan,worldText,resolve,PLACES,OB,resetObjs,HOLD,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,RMP,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const ZR=S.RMP.z;
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};

let pass=0,fail=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x?'  '+x:''));c?pass++:fail++;};
const V=THREE.Vector3;
let H0=0;const hd=()=>{const f=new V(1,0,0).applyQuaternion(S.qt);return Math.atan2(-f.z,f.x)*180/Math.PI;};const yawOf=()=>{let d=hd()-H0;while(d>180)d-=360;while(d<-180)d+=360;return d;};
const feet=()=>{const o=[];for(let i=0;i<S.NL;i++){if(i===0||i===S.NL-1)continue;const w=S.ln[i].clone().multiplyScalar(1000).applyQuaternion(S.qt);o.push([S.pos.x*1000+w.x,S.pos.z*1000+w.z]);}return o;};
const maxDev=(a,b)=>Math.max(...a.map((p,i)=>Math.hypot(p[0]-b[i][0],p[1]-b[i][1])));
(async()=>{
 for(const amp of [0,60]){
  S.setT(amp);S.Q.col=true;S.reset();run(240);H0=hd();
  const f0=feet(),l0=feet()[2].map(v=>v.toFixed(0));S.c.yaw=14;run(240);
  const y=yawOf(),f1=feet();
  ok('amp '+amp+': body twists left 14 deg (got '+y.toFixed(1)+')',Math.abs(y-14)<3);
  ok('amp '+amp+': walking feet stay planted (max shift '+maxDev(f0,f1).toFixed(0)+' mm)',maxDev(f0,f1)<25);
  ok('amp '+amp+': no limb collisions',S.DEP.every(d=>d<=.5));
  S.c.yaw=-14;run(300);const y2=yawOf();ok('amp '+amp+': twists right 14 deg (got '+y2.toFixed(1)+')',Math.abs(y2+14)<4);
  S.reset();run(120);H0=hd();S.c.yaw=-14;run(200);const x0=S.pos.x*1000,z0=S.pos.z*1000;await S.runCommand('move 40 centimeters forward');let n=0;while(S.AUTO.on&&n<30*60){run(1);n++;}run(60);
  const d=Math.hypot(S.pos.x*1000-x0,S.pos.z*1000-z0);ok('amp '+amp+': straightens, then walks 40 cm with a twist set (heading '+yawOf().toFixed(1)+', moved '+d.toFixed(0)+' mm in '+(n/60).toFixed(0)+' s)',d>340&&d<460&&!globalThis.__fail&&Math.abs(yawOf())<4,globalThis.__fail||'');
  S.c.yaw=0;run(400);ok('amp '+amp+': stays straight (got '+yawOf().toFixed(1)+')',Math.abs(yawOf())<3);
 }
 S.setT(0);S.reset();run(60);
 for(const [t,exp] of [['twist left 15 degrees','yaw:15'],['yaw right 10 degrees','yaw:-10'],['twist body to the center','yaw:0'],['swivel left','yaw:15']]){
  const pl=S.localParse(t).map(x=>x.do+':'+x.deg).join(' > ');ok('parse "'+t+'" -> '+pl,pl===exp);}
 S.reset();run(60);H0=hd();await S.runCommand('twist left 14 degrees');let m=0;while(S.AUTO.on&&m<600){run(1);m++;}run(200);ok('command twists the body (got '+yawOf().toFixed(1)+')',Math.abs(yawOf()-14)<2.5);
 console.log(pass+' passed, '+fail+' failed');
})();
