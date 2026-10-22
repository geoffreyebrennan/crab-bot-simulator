// Stuck-detection tests (Phase 2, sub-steps 2.3 and 2.4.7): a truly blocked run must stop within ~5 s of the robot's last progress and name the obstacle;
// trips that merely have a prop in the way must route around it and arrive. (Boxed-in cases: route_fallback_tests.js. Hidden/late obstacles: route_stuck_tests.js.)

module.paths.push('/tmp/node_modules');process.chdir('/mnt/user-data/outputs/tests');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {yawOf,relXY,legs,cj,NL,jawGap,JC,JR,DG,gapCenter,HOLD,flipTest,localParse,HOLD,OB,c,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
// Pick-up tests (Phase 3, sub-step 3.1): every small object x both claws x start poses x terrain. A pick passes when the object is still in the claw
// 2 s after the step ends. Failures are binned by the phase they died in (0 approach, 1 line-up, 2 reach, 3 close, 4 lift).
const planTxt=()=>S.AUTO.steps.map(x=>x.do+':'+(x.claw||'')+(x.auto?'(auto)':'')).join(',');
const go=async(cmd,max=5400)=>{globalThis.__fail='';await S.runCommand(cmd);const pl=planTxt();let t=0;while(S.AUTO.on&&t<max){run(1);t++;}run(120);return {pl,msg:globalThis.__fail,st:S.AUTO.steps.map(x=>x.claw).join(',')};};
const start=(x,z,yd)=>{S.Q.col=true;S.reset();S.pos.x=x/1000;S.pos.z=z/1000;S.pos.y=S.hT(x,z)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(400);};
const P=()=>[S.HOLD[0],S.HOLD[1]];const ob=i=>S.OB[i].p;
(async()=>{run(30);S.setT(0);run(30);
 const cases=[
  ['go to the pink ball and pick it up with your right claw',[800,1400,180],()=>S.HOLD[1]===5],
  ['pick up the red cube, then the teal ball',[800,1400,180],()=>S.HOLD[0]>=0&&S.HOLD[1]>=0&&new Set([S.HOLD[0],S.HOLD[1]]).has(0)&&new Set([S.HOLD[0],S.HOLD[1]]).has(1)],
  ['pick up the red cube with your left claw and the yellow cube with your right claw',[800,1400,180],()=>S.HOLD[0]===0&&S.HOLD[1]===2],
  ['pick up the green cube then move 10 cm back then drop it',[800,1400,180],()=>S.HOLD[0]<0&&S.HOLD[1]<0&&S.OB[4].held<0&&ob(4).y<120],
  ['pick up the pink ball, jump, then put it down',[800,1400,180],()=>S.HOLD[0]<0&&S.HOLD[1]<0],
  ['pick up the pink ball, then go to the teal block and drop it',[800,1400,180],()=>S.HOLD[0]<0&&S.HOLD[1]<0&&Math.hypot(ob(5).x-800,ob(5).z+300)<700],
  ['pick up the red cube and the green cube',[1200,-900,120],()=>S.HOLD[0]>=0&&S.HOLD[1]>=0],
  ['pick up the red cube, then the green cube, then the blue ball',[800,1400,180],()=>false]];
 for(const [cmd,[x,z,y],chk] of cases){start(x,z,y);const r=await go(cmd,9000);let ok=false;try{ok=chk();}catch(e){}
  console.log(ok?'PASS':'FAIL',cmd,'| HOLD',P().join(','),'|',r.msg||'no error','|',r.st);}
 process.exit(0);})();
