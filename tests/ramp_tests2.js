// Ramp tests 2 (4.2): sideways, off the edge, jump, turn, crouch, picking on the ramp.
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
const S=new Function(...Object.keys(g),code+';return {OB,resetObjs,HOLD,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,RMP,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
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
const OR=S.OB.map(b=>[b.x0,b.z0]);
const mv=(o,x,z)=>()=>{S.OB.forEach((b,k)=>{b.x0=OR[k][0];b.z0=OR[k][1];});const b=S.OB[o];b.x0=x;b.z0=z;};
(async()=>{run(30);
  for(const amp of [0,60]){
    await trial('strafe 30 cm right on the slope, amp '+amp,[400,ZR,0],['move 30 cm right'],amp,(x,z)=>Math.abs(z-(ZR+300))<90&&Math.abs(x-400)<150);
    await trial('strafe 30 cm left on the top, amp '+amp,[850,ZR,0],['move 30 cm left'],amp,(x,z)=>Math.abs(z-(ZR-300))<90&&Math.abs(x-850)<250);
    await trial('side ledge stops the crab upright, amp '+amp,[850,ZR+200,0],['move 60 cm right'],amp,(x,z)=>z>ZR+250&&z<ZR+440);
    await trial('ledge blocks climbing on from the side, amp '+amp,[850,ZR+600,0],['move 60 cm left'],amp,(x,z)=>z>ZR+430);
    await trial('jump on the flat top, amp '+amp,[850,ZR,0],['jump'],amp,(x,z)=>Math.abs(x-850)<250&&Math.abs(z-ZR)<250);
    await trial('jump on the up slope, amp '+amp,[400,ZR,0],['jump','jump'],amp,(x,z)=>x>200&&x<800);
    await trial('turn 180 on the slope, amp '+amp,[400,ZR,0],['turn 180 degrees','move 10 cm forward'],amp,(x,z)=>x>200&&x<800);
    await trial('crouch then walk on the slope, amp '+amp,[300,ZR,0],['crouch','move 40 cm forward'],amp,(x,z)=>x>450);
    await trial('pick a ball on the flat top, amp '+amp,[600,ZR,0],['pick up the teal ball'],amp,(x,z,S)=>S.HOLD[0]===1||S.HOLD[1]===1,mv(1,850,ZR));
    await trial('pick a cube on the flat top, amp '+amp,[600,ZR,0],['pick up the red cube'],amp,(x,z,S)=>S.HOLD[0]===0||S.HOLD[1]===0,mv(0,850,ZR));
    await trial('pick a cube on the up slope, amp '+amp,[100,ZR,0],['pick up the red cube'],amp,(x,z,S)=>S.HOLD[0]===0||S.HOLD[1]===0,mv(0,400,ZR-20));
  }
  console.log('ramp 4.2:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
