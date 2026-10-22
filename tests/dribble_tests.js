// Dribbling the soccer ball: plain-language commands, line-up behind the ball, pushing it to a goal. Run: node dribble_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {SOC,hT,c,Q,pos,qt,reset,runCommand,AUTO,vel,setT:v=>{Tamp=v;terrDirty=true;},RMP,PR,PN,resolve,localParse,normPlan,checkPlan,yawOf,ents};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const T=(ok,m)=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+m);};
const B=S.SOC,M=Math,hyp=M.hypot;
const planOf=t=>{const p=S.normPlan(S.localParse(t));return{p,bad:p.length?S.checkPlan(p):'no steps'};};
const upOK=()=>{const u=new THREE.Vector3(0,1,0).applyQuaternion(S.qt);return u.y>.85;};
async function scen(label,{ball=[450,-330],crab=[0,0],yaw=0,amp=0,cmd,check,maxT=140}){
  S.setT(amp);S.reset();run(60);B.p.set(ball[0],S.hT(ball[0],ball[1])+B.r+2,ball[1]);B.v.set(0,0,0);
  S.pos.set(crab[0]/1000,S.hT(crab[0],crab[1])/1000+.107,crab[1]/1000);S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw*M.PI/180);run(90);
  const b0=B.p.clone();globalThis.__fail='';await S.runCommand(cmd);let f=0,hi=0;while(S.AUTO.on&&f<maxT*60){run(1);f++;}run(90);
  const r=check({b0,fail:globalThis.__fail,t:f/60});T(r[0]&&upOK(),label+' -> '+r[1]+(upOK()?'':' (TIPPED)')+' ['+(f/60).toFixed(0)+' s]');S.setT(0);}
(async()=>{run(30);
 // parsing
 let q=planOf('dribble the soccer ball to the red pillar');T(!q.bad&&q.p.length===1&&q.p[0].do==='dribble'&&q.p[0].to==='red pillar','parse: dribble to the red pillar '+JSON.stringify(q.p));
 q=planOf('go to the soccer ball, then dribble it to the yellow pillar');T(!q.bad&&q.p.length===1&&q.p[0].do==='dribble'&&q.p[0].to==='yellow pillar','parse: go to it, then dribble it '+JSON.stringify(q.p));
 q=planOf('push the soccer ball 2 metres forward');T(!q.bad&&q.p[0].do==='dribble'&&q.p[0].cm===200&&q.p[0].dir==='forward','parse: push 2 m forward '+JSON.stringify(q.p));
 q=planOf('dribble the football 60 cm to the left');T(!q.bad&&q.p[0].dir==='left'&&q.p[0].cm===60,'parse: football 60 cm left '+JSON.stringify(q.p));
 q=planOf('dribble the ball back 30 centimeters');T(!q.bad&&q.p[0].dir==='back'&&q.p[0].cm===30,'parse: the ball back 30 cm '+JSON.stringify(q.p));
 q=planOf('push the soccer ball up the ramp');T(!q.bad&&q.p[0].to==='top of the ramp','parse: up the ramp '+JSON.stringify(q.p));
 q=planOf('dribble the soccer ball');T(!q.bad&&q.p[0].cm===100&&q.p[0].dir==='forward','parse: default 100 cm forward '+JSON.stringify(q.p));
 q=planOf('bring the soccer ball to the basket');T(/too big/.test(q.bad),'parse: not into the basket ('+q.bad+')');
 q=planOf('go to the soccer ball');T(!q.bad&&q.p.length===1&&q.p[0].do==='goto','parse: go to the soccer ball is still a goto');
 q=planOf('pick up the soccer ball');T(!!q.bad,'parse: cannot pick up the soccer ball ('+q.bad+')');
 q=planOf('pick up the pink ball and push it forward');T(q.p.every(s=>s.do!=='dribble'),'parse: small balls are not dribbled '+JSON.stringify(q.p.map(s=>s.do)));
 // behaviour
 const P=i=>S.PR[i],RP=P(0);
 const gapTo=(pr)=>hyp(B.p.x-pr.x,B.p.z-pr.z)-pr.r-B.r;
 await scen('to the red pillar from the default start',{cmd:'dribble the soccer ball to the red pillar',check:()=>{const g=gapTo(RP);return[g>-8&&g<140,'ball surface '+g.toFixed(0)+' mm from the pillar, failure: '+(globalThis.__fail||'none')];}});
 await scen('100 cm forward from the default start',{cmd:'dribble the soccer ball 100 cm forward',check:({b0})=>{const dx=B.p.x-b0.x,dz=B.p.z-b0.z;return[M.abs(dx-1000)<110&&M.abs(dz)<110,'ball moved ('+dx.toFixed(0)+','+dz.toFixed(0)+'), failure: '+(globalThis.__fail||'none')];}});
 await scen('60 cm left (needs the far side of the ball)',{cmd:'push the soccer ball 60 cm left',check:({b0})=>{const dx=B.p.x-b0.x,dz=B.p.z-b0.z;return[M.abs(dx)<110&&M.abs(-dz-600)<110,'ball moved ('+dx.toFixed(0)+','+dz.toFixed(0)+'), failure: '+(globalThis.__fail||'none')];}});
 await scen('60 cm back, crab starts ahead of the ball',{ball:[100,-300],crab:[500,-300],yaw:180,cmd:'dribble the ball 60 cm back',check:({b0})=>{const dx=B.p.x-b0.x;return[M.abs(dx-600)<110,'ball moved '+dx.toFixed(0)+' in x, failure: '+(globalThis.__fail||'none')];}});
 await scen('150 cm forward, crab beside the ball',{ball:[-300,-250],crab:[-300,250],yaw:0,cmd:'dribble the soccer ball 150 cm forward',check:({b0})=>{const dx=B.p.x-b0.x,dz=B.p.z-b0.z;return[M.abs(dx-1500)<130&&M.abs(dz)<150,'ball moved ('+dx.toFixed(0)+','+dz.toFixed(0)+'), failure: '+(globalThis.__fail||'none')];},maxT:200});
 await scen('go to the ball, then dribble it to the yellow pillar',{cmd:'go to the soccer ball, then dribble it to the yellow pillar',check:()=>{const g=gapTo(P(2));return[g>-8&&g<140,'ball surface '+g.toFixed(0)+' mm from the yellow pillar, failure: '+(globalThis.__fail||'none')];},maxT:200});
 await scen('100 cm forward on 30 mm rough ground',{amp:30,cmd:'dribble the soccer ball 100 cm forward',check:({b0})=>{const dx=B.p.x-b0.x,dz=B.p.z-b0.z;return[M.abs(dx-1000)<150&&M.abs(dz)<150,'ball moved ('+dx.toFixed(0)+','+dz.toFixed(0)+'), failure: '+(globalThis.__fail||'none')];}});
 await scen('100 cm forward on 60 mm rough ground (very rough: must make progress and stay upright, or say why it stopped)',{amp:60,cmd:'dribble the soccer ball 100 cm forward',check:({b0})=>{const dx=B.p.x-b0.x;return[dx>400||!!globalThis.__fail,'ball moved '+dx.toFixed(0)+' in x, failure: '+(globalThis.__fail||'none')];}});
 console.log('dribble:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
