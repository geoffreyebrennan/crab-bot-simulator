// Put it in the basket (4.6): parser, plan checks, and walking, carrying and dropping each item in.
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
const lp=t=>{S.reset();return S.localParse(t).map(x=>x.do+(x.target?':'+x.target:'')+(x.item?'['+x.item+']':'')).join(' > ');};
const LP=[['go to the basket','goto:brown basket'],['go to the basket and stop 20 cm from it','goto:brown basket'],
 ['pick up the pink ball and put it in the basket','pick:pink ball > dropin:brown basket'],
 ['pick up the pink ball, then drop it in the basket','pick:pink ball > dropin:brown basket'],
 ['put the red cube in the basket','pick:red cube > dropin:brown basket[red cube]'],
 ['bring the teal ball to the basket','pick:teal ball > dropin:brown basket'],
 ['take the yellow cube to the basket','pick:yellow cube > dropin:brown basket'],
 ['carry the blue ball into the bin','pick:blue ball > dropin:brown basket'],
 ['deposit the green cube in the bucket','pick:green cube > dropin:brown basket'],
 ['pick up the pink ball with your left claw and put it in the basket','pick:pink ball > dropin:brown basket'],
 ['pick up the red cube and the pink ball and put both in the basket','pick:red cube > pick:pink ball > dropin:brown basket[red cube] > dropin:brown basket[pink ball]'],
 ['pick up the red cube, then the pink ball, and put them both in the basket','pick:red cube > pick:pink ball > dropin:brown basket[red cube] > dropin:brown basket[pink ball]'],
 ['put the red cube and the pink ball in the basket','pick:red cube > dropin:brown basket[red cube] > pick:pink ball > dropin:brown basket[pink ball]'],
 ['pick up the pink ball and put it in the basket, then put the red cube in the basket','pick:pink ball > dropin:brown basket[pink ball] > pick:red cube > dropin:brown basket[red cube]'],
 ['go to the pink ball and pick it up, then go up the ramp','pick:pink ball > goto:top of the ramp'],
 ['pick up the pink ball and go to the basket','pick:pink ball > goto:brown basket']];
for(const [t,w] of LP){const r=lp(t);T(r.startsWith(w),'parse "'+t+'" -> '+r);}
T(lp('go to the red pillar and drop it')==='goto:red pillar > drop','"drop it" without a basket is still a plain drop ('+lp('go to the red pillar and drop it')+')');
// plan checks (the Claude path)
T(S.checkPlan(S.normPlan([{do:'pick',target:'pink ball',claw:'left'},{do:'dropin',target:'basket'}]))==='','Claude plan with dropin passes ('+S.checkPlan(S.normPlan([{do:'pick',target:'pink ball',claw:'left'},{do:'dropin',target:'basket'}]))+')');
T(S.normPlan([{do:'dropin',target:'whatever',item:'pink ball'}])[0].target==='brown basket','dropin always targets the basket');
T(S.normPlan([{do:'dropin',target:'x',item:'purple dragon'}])[0].item===undefined,'unknown item name is dropped');
T(S.worldText().includes('dropin')===false,'world text itself does not carry step syntax');
// walking
async function run1(label,pose,cmd,amp,okf){globalThis.__fail='';S.setT(amp);S.Q.col=true;S.reset();S.pos.x=pose[0]/1000;S.pos.z=pose[1]/1000;S.pos.y=.15+S.hT(pose[0],pose[1])/1000;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),pose[2]*Math.PI/180);run(150);
  await S.runCommand(cmd);let t=0,mu=1;while(S.AUTO.on&&t<240*60){run(1);t++;mu=Math.min(mu,new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y);}run(180);
  const ok=okf()&&mu>.7&&!S.AUTO.on&&(!globalThis.__fail||/fails clearly/.test(label));T(ok,label.padEnd(58)+'| '+(t/60).toFixed(0)+' s, in basket '+S.OB.filter(S.inBasket).length+', held '+S.HOLD.join('/')+' '+(globalThis.__fail||''));return ok;}
const NAMES=['red cube','teal ball','yellow cube','blue ball','green cube','pink ball'];
const only=process.argv.indexOf('--only')<0?null:process.argv[process.argv.indexOf('--only')+1].split(',');
const poses=process.argv.indexOf('--poses')<0?['A']:process.argv[process.argv.indexOf('--poses')+1].split(',');
const POSE={A:[0,0,0],B:[-1200,-900,0],C:[-300,-1500,90],D:[600,-1000,180]};
(async()=>{run(30);
 for(const amp of (process.argv.indexOf('--amps')<0?[0,60]:process.argv[process.argv.indexOf('--amps')+1].split(',').map(Number)))for(const pn of poses)for(const n of NAMES){if(only&&!only.includes(n))continue;if(process.argv.includes('--nomatrix'))continue;const k=NAMES.indexOf(n);
   await run1('pose '+pn+', amp '+amp+': pick up the '+n+' and put it in the basket',POSE[pn],'pick up the '+n+' and put it in the basket',amp,()=>S.inBasket(S.OB[k])&&S.HOLD[0]<0&&S.HOLD[1]<0);}
 if(process.argv.indexOf('--chain')>=0){
   await run1('both: pick up the red cube and the pink ball and put both in the basket',[0,0,0],'pick up the red cube and the pink ball and put both in the basket',0,()=>S.inBasket(S.OB[5])&&S.inBasket(S.OB[0])&&S.HOLD[0]<0&&S.HOLD[1]<0);
   await run1('both, named: put the green cube and the teal ball in the basket',[0,0,0],'put the green cube and the teal ball in the basket',0,()=>S.inBasket(S.OB[4])&&S.inBasket(S.OB[1]));
   await run1('two items: pink ball then red cube',[0,0,0],'pick up the pink ball and put it in the basket, then pick up the red cube and put it in the basket',0,()=>S.inBasket(S.OB[5])&&S.inBasket(S.OB[0]));
   await run1('three items in a row',[0,0,0],'put the pink ball in the basket, put the green cube in the basket, put the teal ball in the basket',0,()=>[5,4,1].every(k=>S.inBasket(S.OB[k])));
   await run1('put it in the basket with nothing held (fails clearly)',[0,0,0],'put it in the basket',0,()=>!!globalThis.__fail);
 }
 console.log('put in basket 4.6:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
