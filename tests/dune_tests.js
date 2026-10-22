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
const S=new Function(...Object.keys(g),code+';return {DUNES,duneFix,SOC,hT,c,Q,pos,qt,reset,runCommand,AUTO,vel,setT:v=>{Tamp=v;terrDirty=true;},RMP,PR,PN,resolve,localParse,normPlan,checkPlan,yawOf,ents};')(...Object.values(g));
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
 const inside=(x,z,rad)=>S.duneFix(x,z,rad-2)!==null;
 // ball shot at 8 dune directions
 for(let k=0;k<8;k++){const a=k*M.PI/4;S.setT(0);S.reset();run(60);const x0=2400*M.cos(a),z0=2400*M.sin(a);B.p.set(x0,S.hT(x0,z0)+B.r+2,z0);B.v.set(4000*M.cos(a),0,4000*M.sin(a));run(60*8);
  const bad=inside(B.p.x,B.p.z,B.r);T(!bad&&hyp(B.p.x,B.p.z)<3300,'ball shot outward at '+(k*45)+' deg stops at r='+hyp(B.p.x,B.p.z).toFixed(0)+(bad?' INSIDE a dune':''));}
 // crab walking outward
 for(let k=0;k<8;k++){const a=k*M.PI/4;S.setT(0);S.reset();run(60);const x0=2300*M.cos(a),z0=2300*M.sin(a);S.pos.set(x0/1000,S.hT(x0,z0)/1000+.107,z0/1000);S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),-a);run(90);
  S.AUTO.on=false;await S.runCommand('move 300 cm forward');let f=0;while(S.AUTO.on&&f<60*70){run(1);f++;}run(60);
  const x=S.pos.x*1000,z=S.pos.z*1000,bad=inside(x,z,330);T(!bad&&upOK(),'crab walks outward at '+(k*45)+' deg, stops at r='+hyp(x,z).toFixed(0)+(bad?' INSIDE a dune':'')+(upOK()?'':' TIPPED'));}
 console.log('dunes: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
})();