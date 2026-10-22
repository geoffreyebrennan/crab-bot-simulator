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
const S=new Function(...Object.keys(g),code+';return {BK,PR,inBasket,gripStep,OBN,localParse,normPlan,checkPlan,worldText,resolve,PLACES,OB,resetObjs,HOLD,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,RMP,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const ZR=S.RMP.z;
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};

let pass=0,fail=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x?'  '+x:''));c?pass++:fail++;};
const overlap=(A,B)=>{const dx=B.p.x-A.p.x,dy=B.p.y-A.p.y,dz=B.p.z-A.p.z;
  if(A.t==='c'&&B.t==='c')return 20-Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz));
  if(A.t==='b'&&B.t==='b')return 22-Math.hypot(dx,dy,dz);
  const C=A.t==='c'?A:B,Sx=A.t==='c'?B:A,q=['x','y','z'].map(a=>Math.max(C.p[a]-10,Math.min(C.p[a]+10,Sx.p[a])));
  return 11-Math.hypot(Sx.p.x-q[0],Sx.p.y-q[1],Sx.p.z-q[2]);};
function worst(){let w=-1e9;for(let i=0;i<S.OB.length;i++)for(let j=i+1;j<S.OB.length;j++)w=Math.max(w,overlap(S.OB[i],S.OB[j]));return w;}
(async()=>{
 S.setT(0);S.Q.col=true;S.reset();
 for(const cmd of ['pick up the red cube and put it in the basket','pick up the teal ball and put it in the basket','pick up the yellow cube and put it in the basket','pick up the blue ball and put it in the basket']){
  globalThis.__fail='';await S.runCommand(cmd);let n=0;while(S.AUTO.on&&n<240*60){run(1);n++;}
  run(120);console.log(cmd+' -> '+(globalThis.__fail||'ok')+', '+(n/60).toFixed(0)+' s, in basket '+S.OB.filter(S.inBasket).length);
 }
 const w=worst(),nb=S.OB.filter(S.inBasket).length;
 ok('end to end: none overlap (worst '+w.toFixed(1)+' mm)',w<=1.5);ok('end to end: 4 in basket',nb===4,nb+'');
 console.log(S.OB.map(o=>o.t+' '+(o.p.x-S.PR.find(q=>q.basket).x).toFixed(0)+','+o.p.y.toFixed(0)+','+(o.p.z-S.PR.find(q=>q.basket).z).toFixed(0)).join(' | '));
 console.log(pass+' passed, '+fail+' failed');
})();
