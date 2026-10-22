// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {legs,NL,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const M=Math,v=new THREE.Vector3();
// depth (mm) by which a sphere of radius r at body-frame point p sticks into the shell (0 if clear)
function pen(p,r){const yy=p.y-S.LIFT;let d=0;p=p.clone();p.x/=S.SHS;p.z/=S.SHS;r=r/S.SHS;
  if(yy>=-19&&yy<=28){const rho=S.skRho(yy)+r,e=M.hypot(p.x/rho,p.z/(rho*S.SKZ));if(e<1)d=M.max(d,(1-e)*rho);}
  else if(yy>28){const e=M.hypot(p.x/(118+r),(yy-12)/(50+r),p.z/(128+r));if(e<1&&yy<62+r)d=M.max(d,(1-e)*50);}
  return d;}
// sample points along each part of each leg (link meshes carry position + quaternion; length along local y)
const worst={};function sample(tag){const inv=new THREE.Matrix4().copy(S.body.matrixWorld).invert();S.body.updateMatrixWorld(true);
  for(let i=0;i<S.NL;i++){const L=S.legs[i];
    const parts=[[L.lk[0],S.legs[i].len0||0,14],[L.lk[1],0,15],[L.lk[2],0,13],[L.sv[1],0,17],[L.sv[2],0,17]];
    L.lk.forEach((o,n)=>{o.updateWorldMatrix(true,false);const len=[55,80,n===2?(S.ARM(i)?65:130):0][n];for(let s=0;s<=6;s++){v.set(0,len*s/6,0).applyMatrix4(o.matrixWorld).applyMatrix4(inv);const d=pen(v,[16,18,14][n]);if(d>0){const k=tag+' L'+i+(S.ARM(i)?' arm':' leg')+' link'+n;worst[k]=M.max(worst[k]||0,d);}}});
    L.sv.forEach((o,n)=>{if(!n)return;o.updateWorldMatrix(true,false);v.set(0,0,0).applyMatrix4(o.matrixWorld).applyMatrix4(inv);const d=pen(v,24);if(d>0){const k=tag+' L'+i+(S.ARM(i)?' arm':' leg')+' servo'+n;worst[k]=M.max(worst[k]||0,d);}});
    if(L.cl){L.cl.updateWorldMatrix(true,false);[[10,20,0],[10,50,0],[0,30,12]].forEach(q=>{v.set(...q).applyMatrix4(L.cl.matrixWorld).applyMatrix4(inv);const d=pen(v,22);if(d>0){const k=tag+' claw';worst[k]=M.max(worst[k]||0,d);}});}}}
async function scen(tag,cmd,maxF){S.reset();run(3);const p=cmd?S.runCommand(cmd):Promise.resolve();await p;let f=0;while(((S.AUTO.on)||f<120)&&f<maxF){run(1);if(f%4===0)sample(tag);f++;}}
(async()=>{
await scen('stand',null,60);
await scen('walk','move 40 centimeters forward',900);
await scen('turn','turn 90 degrees right',600);
await scen('jump','jump',300);
await scen('crouch',null,10);S.c.crouch=true;run(200);for(let f=0;f<60;f++){run(1);sample('crouch');}S.c.crouch=false;
S.reset();run(3);S.c.pitch=.25;for(let f=0;f<240;f++){run(1);if(f%4===0)sample('pitchUp');}S.c.pitch=-.25;for(let f=0;f<240;f++){run(1);if(f%4===0)sample('pitchDn');}S.c.pitch=0;
await scen('pick','pick up the pink ball with your right claw',1800);
await scen('pick2','pick up the red cube with your left claw',1800);
const keys=Object.keys(worst);console.log(keys.length?keys.map(k=>k+': '+worst[k].toFixed(1)+' mm').join('\n'):'no part enters the shell');
console.log('shell clearance:',keys.length?'FAIL ('+keys.length+' areas)':'PASS');})();
