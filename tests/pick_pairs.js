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
const NM=['red cube','teal ball','yellow cube','blue ball','green cube','pink ball'];
(async()=>{run(30);S.setT(0);run(30);let ok=0,tot=0;const pairs=[[0,1],[1,0],[2,3],[3,2],[4,5],[5,4],[0,5],[3,4],[1,2],[2,5]];
 for(const [pn,[x,z,y]] of [['C',[800,1400,180]],['G',[1200,-900,120]]])for(const [a,b] of pairs){
  start(x,z,y);const r=await go('pick up the '+NM[a]+', then the '+NM[b],9000);const h=[S.HOLD[0],S.HOLD[1]].sort();const good=h[0]===Math.min(a,b)&&h[1]===Math.max(a,b);tot++;if(good)ok++;
  console.log(good?'PASS':'FAIL',pn,NM[a],'then',NM[b],'| HOLD',S.HOLD.join(','),'|',r.msg||'');}
 console.log('pair chains',ok,'/',tot);process.exit(0);})();
