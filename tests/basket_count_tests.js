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
const txt=()=>{S.gripStep.s=null;S.gripStep(.016);return S.gripStep.s;};
function drop(o,x,z,y){o.held=-1;o.p.set(x,y,z);o.v.set(0,0,0);}
(async()=>{run(30);
 for(const amp of [0,60]){
  S.setT(amp);S.reset();run(5);const p=bp(),O=S.OB;
  T(/In basket: 0 of 6/.test(txt())&&/The basket is empty\./.test(S.worldText()),'amp '+amp+': starts empty ('+txt().split('   ').pop()+')');
  drop(O[1],p.x+20,p.z-10,p.base+120);drop(O[0],p.x-30,p.z+25,p.base+150);run(240);
  T(/In basket: 2 of 6/.test(txt())&&S.worldText().includes('In the basket now: red cube, teal ball.'),'amp '+amp+': two items dropped in are counted and named ('+S.worldText().split('\n').filter(l=>/basket now/.test(l))[0]+')');
  O[2].held=1;O[2].p.set(p.x,p.base+60,p.z);
  T(/In basket: 2 of 6/.test(txt()),'amp '+amp+': an item still held by a claw over the basket is not counted');
  O[2].held=-1;drop(O[2],p.x+300,p.z,p.base+O[2].r);run(30);
  T(/In basket: 2 of 6/.test(txt()),'amp '+amp+': an item near the basket on the ground is not counted');
  drop(O[2],p.x,p.z,p.base+80+40);O[2].v.set(0,0,0);
  T(!S.inBasket(O[2]),'amp '+amp+': an item above the rim is not counted until it falls in');
  run(200);T(S.inBasket(O[2])&&/In basket: 3 of 6/.test(txt()),'amp '+amp+': ...and is counted once it has fallen in');
  drop(O[1],p.x+400,p.z+200,p.base+60);run(120);
  T(/In basket: 2 of 6/.test(txt()),'amp '+amp+': an item taken out leaves the count');
  [3,4,5,1].forEach((k,q)=>drop(O[k],p.x-50+q*30,p.z+(q%2?30:-30),p.base+100+q*30));run(400);
  T(/In basket: 6 of 6/.test(txt()),'amp '+amp+': all six fit ('+txt().split('   ').pop()+')');
  S.reset();run(5);
  T(/In basket: 0 of 6/.test(txt())&&O.every(o=>!S.inBasket(o)),'amp '+amp+': reset empties the basket and returns the items');
 }
 console.log('basket count 4.5:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
