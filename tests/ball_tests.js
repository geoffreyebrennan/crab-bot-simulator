// Soccer ball (Phase 6): rolling physics and being pushed by the crab. Run: node ball_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {SOC,hT,c,Q,pos,qt,reset,runCommand,AUTO,vel,setT:v=>{Tamp=v;terrDirty=true;},RMP,PR};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const T=(ok,m)=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+m);};
const B=S.SOC,place=(x,z,vx=0,vz=0,up=2)=>{B.p.set(x,S.hT(x,z)+B.r+up,z);B.v.set(vx,0,vz);};
(async()=>{run(30);
 S.reset();run(180);T(M3(B.p.x-450)<1&&M3(B.p.z+330)<1&&M3(B.p.y-103)<1.5,'rests where it starts ('+B.p.toArray().map(v=>v.toFixed(1))+')');
 S.reset();B.p.y=700;run(240);T(M3(B.p.y-103)<1.5&&B.v.length()<15,'dropped from 60 cm, bounces and comes to rest at y '+B.p.y.toFixed(1));
 S.reset();place(430,100,1200,0);let mx=0;for(let f=0;f<150;f++){run(1);mx=Math.max(mx,B.p.x);}T(mx<635&&B.p.x<mx-20,'rolls into the red pillar and bounces back (max x '+mx.toFixed(0)+', end '+B.p.x.toFixed(0)+')');
 S.reset();place(300,-130,1000,0);run(60);T(B.p.y>60,'ball over small items stays sane');
 // pushing on the flat
 S.reset();S.pos.set(.12,.107,-.33);run(60);const x0=B.p.x;const r1=await S.runCommand('move 45 cm forward');let f=0,vmax=0;while(S.AUTO.on&&f<60*40){run(1);f++;vmax=Math.max(vmax,B.v.length());}run(60);
 T(B.p.x>x0+150,'pushes the ball ahead of it on flat ground (ball x '+x0.toFixed(0)+' to '+B.p.x.toFixed(0)+', crab x '+(S.pos.x*1000).toFixed(0)+', '+(f/60).toFixed(0)+' s, ball top speed '+vmax.toFixed(0)+' mm/s)');
 // slope release
 S.reset();place(400,S.RMP.z);run(180);T(B.p.x<390,'a ball let go on the ramp rolls back down (x '+B.p.x.toFixed(0)+')');
 // pushing up the ramp
 S.reset();place(60,S.RMP.z);S.pos.set(-.3,.107,S.RMP.z/1000);run(60);const ya=B.p.y,xa=B.p.x;await S.runCommand('move 90 cm forward');f=0;vmax=0;let ymax=0;while(S.AUTO.on&&f<60*60){run(1);f++;vmax=Math.max(vmax,B.v.length());ymax=Math.max(ymax,B.p.y);}
 T(ymax>ya+40,'pushes the ball up the ramp (ball height gained '+(ymax-ya).toFixed(0)+' mm, start x '+xa.toFixed(0)+', end x '+B.p.x.toFixed(0)+', crab x '+(S.pos.x*1000).toFixed(0)+', top speed '+vmax.toFixed(0)+' mm/s)');
 // rough terrain
 S.reset();S.setT(60);run(30);place(450,-330);run(200);T(B.v.length()<20&&B.p.y>60,'on rough ground it settles (speed '+B.v.length().toFixed(1)+')');S.setT(0);
 console.log('soccer ball:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
function M3(v){return Math.abs(v);}
function hT0(x,z){return S.hT(x,z)+B.r;}
