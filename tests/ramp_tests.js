// Ramp tests: the crab must walk up, over and down the ramp (flat and rough ground), in both directions, without flipping or stalling.
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
const S=new Function(...Object.keys(g),code+';return {Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,RMP,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const ZR=S.RMP.z;
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;
async function trial(label,[sx,sz,yd],cmd,amp,okf){
  globalThis.__fail='';S.Q.col=true;S.setT(amp);S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
  await S.runCommand(cmd);let t=0,maxY=0,minUp=1;
  while(S.AUTO.on&&t<120*60){run(1);t++;maxY=Math.max(maxY,S.pos.y*1000);const up=new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y;minUp=Math.min(minUp,up);}
  run(60);const x=S.pos.x*1000,z=S.pos.z*1000,ok=okf(x,z)&&minUp>.6&&!globalThis.__fail;ok?pass++:fail++;
  console.log((ok?'PASS ':'FAIL ')+label.padEnd(40)+'| end ('+x.toFixed(0)+','+z.toFixed(0)+') max body height '+maxY.toFixed(0)+' mm, min tilt cos '+minUp.toFixed(2)+', '+(t/60).toFixed(0)+' s '+(globalThis.__fail||''));
}
(async()=>{run(30);
  for(const amp of [0,60]){
    await trial('up, over and down, amp '+amp,[-50,ZR,0],'move 160 cm forward',amp,(x,z)=>x>1450&&Math.abs(z-ZR)<120);
    await trial('onto the flat top, amp '+amp,[-50,ZR,0],'move 90 cm forward',amp,(x,z)=>x>780&&x<900&&Math.abs(z-ZR)<120);
    await trial('back over the ramp, amp '+amp,[1650,ZR,180],'move 175 cm forward',amp,(x,z)=>x<-30&&Math.abs(z-ZR)<120);
  }
  console.log('ramp:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
