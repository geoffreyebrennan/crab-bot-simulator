// Ramp places (4.3): names, parser, Claude plan checks, and walking to the ramp, its top and its far end.
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
const S=new Function(...Object.keys(g),code+';return {localParse,normPlan,checkPlan,worldText,resolve,PLACES,OB,resetObjs,HOLD,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,RMP,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
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
// names and parser
const nm=t=>{const e=S.resolve(t);return e?e.name:null;};
for(const [t,w] of [['the ramp','ramp'],['ramp','ramp'],['the bottom of the ramp','ramp'],['the foot of the ramp','ramp'],['top of the ramp','top of the ramp'],['the top of the ramp','top of the ramp'],['up the ramp','top of the ramp'],['onto the ramp','top of the ramp'],['the flat part of the ramp','top of the ramp'],['far end of the ramp','far end of the ramp'],['over the ramp','far end of the ramp'],['across the ramp','far end of the ramp'],['down the ramp','far end of the ramp'],['the other side of the ramp','far end of the ramp'],['the orange ramp','ramp'],['the red pillar','red pillar'],['the orange pillar','orange pillar'],['the pink ball','pink ball'],['the purple dragon',null]])T(nm(t)===w,'resolve "'+t+'" -> '+nm(t)+(w===nm(t)?'':' (wanted '+w+')'));
const lp=t=>S.localParse(t).map(x=>x.do+(x.target?':'+x.target:'')).join(' > ');
for(const [t,w] of [['go to the ramp','goto:ramp'],['go up the ramp','goto:top of the ramp'],['walk over the ramp','goto:far end of the ramp'],['go up the ramp and then jump','goto:top of the ramp > jump'],['go to the ramp, go over it','goto:ramp'],['go to the pink ball and then go up the ramp','goto:pink ball > goto:top of the ramp'],['go to the teal ball on the ramp','goto:teal ball']])T(lp(t).startsWith(w),'parse "'+t+'" -> '+lp(t));
T(S.worldText().includes('- ramp (a place')&&S.worldText().includes('top of the ramp')&&S.worldText().includes('far end of the ramp'),'world text lists the ramp places');
T(S.checkPlan(S.normPlan([{do:'goto',target:'top of the ramp'},{do:'goto',target:'far end of the ramp',gap_cm:20}]))==='','Claude plan with ramp places passes checks');
T(S.checkPlan(S.normPlan([{do:'pick',target:'ramp'}]))!=='','picking the ramp is rejected');
T(S.checkPlan(S.normPlan([{do:'goto',target:'purple ramp dragon'}]))!=='','nonsense ramp name rejected');
// walking
async function go(label,[sx,sz,yd],cmd,amp,tx,tz,tol){
  globalThis.__fail='';S.Q.col=true;S.setT(amp);S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15+S.hT(sx,sz)/1000;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
  await S.runCommand(cmd);let t=0,mu=1;while(S.AUTO.on&&t<150*60){run(1);t++;mu=Math.min(mu,new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y);}
  run(60);const x=S.pos.x*1000,z=S.pos.z*1000,d=Math.hypot(x-tx,z-tz),ok=d<=tol&&mu>.6&&!globalThis.__fail&&!S.AUTO.on;
  T(ok,label.padEnd(46)+'| end ('+x.toFixed(0)+','+z.toFixed(0)+') '+d.toFixed(0)+' mm from target, y '+(S.pos.y*1000).toFixed(0)+', '+(t/60).toFixed(0)+' s '+(globalThis.__fail||''));}
(async()=>{run(30);
  for(const amp of [0,60]){
    await go('go to the ramp from the start, amp '+amp,[0,0,0],'go to the ramp',amp,240,ZR,330);
    await go('go up the ramp from the start, amp '+amp,[0,0,0],'go up the ramp',amp,850,ZR,330);
    await go('go up the ramp from behind, amp '+amp,[1000,-700,90],'go up the ramp',amp,850,ZR,330);
    await go('go over the ramp from the foot, amp '+amp,[-100,ZR,0],'go over the ramp',amp,1700,ZR,330);
    await go('go down the ramp from the top, amp '+amp,[850,ZR,0],'go down the ramp',amp,1700,ZR,330);
    await go('back to the foot from the top, amp '+amp,[850,ZR,180],'go to the ramp',amp,240,ZR,330);
    await go('pink ball then up the ramp, amp '+amp,[0,0,0],'go to the pink ball then go up the ramp',amp,850,ZR,330);
  }
  await go('red pillar still works',[0,0,0],'go to the red pillar',0,500,0,420);
  console.log('ramp places 4.3:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
