// Stuck-detection tests (Phase 2, sub-steps 2.3 and 2.4.7): a truly blocked run must stop within ~5 s of the robot's last progress and name the obstacle;
// trips that merely have a prop in the way must route around it and arrive. (Boxed-in cases: route_fallback_tests.js. Hidden/late obstacles: route_stuck_tests.js.)

module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {flipTest,localParse,HOLD,OB,c,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const out=[];
const chk=(ok,msg)=>{if(ok)pass++;else{fail++;out.push('FAIL '+msg);}};
async function trial(label,[sx,sz,yd],cmd,expect){
  globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
  const e=expect.target?S.ents().find(q=>q.name===expect.target):null;
  await S.runCommand(cmd);let t=0,best=1e9,tBest=0,p0=[S.pos.x*1000,S.pos.z*1000],tMove=0;
  while(S.AUTO.on&&t<90*60){run(1);t++;const d=e?Math.hypot(S.pos.x*1000-e.x,S.pos.z*1000-e.z):Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);
    if(expect.target?d<best-25:d>best+25-1e9&&false){}
    if(expect.target){if(d<best-25){best=d;tBest=t;}}else{const m=Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);if(m>best||best===1e9){best=m;}if(m>tMove+25){tMove=m;tBest=t;}}}
  const msg=globalThis.__fail,since=(t-tBest)/60;
  chk(!!msg,label+': blocked run should end with a message (ran '+(t/60).toFixed(1)+' s, AUTO.on='+S.AUTO.on+')');
  if(msg){chk(msg.includes(expect.blocker),label+': message should name "'+expect.blocker+'" -> '+JSON.stringify(msg));
    chk(since<=6.5,label+': should stop within ~5 s of the last progress, took '+since.toFixed(1)+' s');}
  console.log((msg&&msg.includes(expect.blocker)&&since<=6.5?'PASS ':'FAIL ')+label.padEnd(44)+'| stopped '+since.toFixed(1)+' s after last progress | "'+(msg||'(no message, '+(t/60).toFixed(0)+' s)')+'"');
}

const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const R={};const yawD=()=>{const f=new THREE.Vector3(1,0,0).applyQuaternion(S.qt);return Math.atan2(-f.z,f.x)*180/Math.PI;};
const wrap=a=>{while(a>180)a-=360;while(a<-180)a+=360;return a;};
async function cmd(text,{pose=[-1500,1200,0],terr=0,secs=60,settle=90}={}){
  globalThis.__fail='';S.setT(terr);run(30);S.reset();S.pos.x=pose[0]/1000;S.pos.z=pose[1]/1000;S.pos.y=S.hT(pose[0],pose[1])/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),pose[2]*Math.PI/180);run(150);
  const p0=[S.pos.x*1000,S.pos.z*1000],y0=yawD();await S.runCommand(text);let t=0;while(S.AUTO.on&&t<secs*60){run(1);t++;}run(settle);
  const dx=S.pos.x*1000-p0[0],dz=S.pos.z*1000-p0[1],y=Math.atan2(-0,1)+yawD()*Math.PI/180,f=[Math.cos(y),-Math.sin(y)],l=[-Math.sin(y),-Math.cos(y)];
  const fy=y0*Math.PI/180,ff=[Math.cos(fy),-Math.sin(fy)],ll=[-Math.sin(fy),-Math.cos(fy)];
  return{fwd:Math.round(dx*ff[0]+dz*ff[1]),left:Math.round(dx*ll[0]+dz*ll[1]),turn:Math.round(wrap(yawD()-y0)),secs:+(t/60).toFixed(1),fail:globalThis.__fail||''};}
(async()=>{run(30);
  for(const [k,t,o] of [['fwd50','move 50 cm forward'],['back30','move 30 cm back'],['left20','move 20 cm left'],['right20','move 20 cm to the right'],['fwd12jump','move 12 centimeters forward, then jump'],['jump','jump'],['turnL90','turn 90 degrees left'],['turnR45','turn 45 degrees right'],['turn180','turn around'],['fwd60rough','move 60 cm forward',{terr:60}],['turnL90rough','turn 90 degrees left',{terr:60}],['fwd100','move 1 meter forward'],['seq','move 30 cm forward, turn left 90 degrees, move 20 cm forward']])R[k]=await cmd(t,o||{});
  S.setT(0);
  // parser: plans for a fixed list of sentences
  const sents=['go to the pink ball','go to the pink ball and pick it up with your right claw','move 12 centimeters forward then jump','turn left 90 degrees','walk forward half a meter','crouch then stand up','pitch up 10 degrees','face the red pillar','go to the purple dragon','pick up the blue block','open your left claw','wait 3 seconds','go to the nearest cube','move forward twenty five centimeters and turn right forty five degrees'];
  R.parse={};for(const t of sents){try{R.parse[t]=JSON.stringify(S.localParse(t));}catch(e){R.parse[t]='ERR '+e.message;}}
  // self-righting
  globalThis.__fail='';S.reset();S.Q.auto=true;run(120);S.flipTest();let up0=new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y;run(60*10);R.right={upBefore:+up0.toFixed(2),upAfter:+new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y.toFixed(2)};
  // terrain walking, keyboard-style drive
  for(const amp of [0,60,120]){S.setT(amp);run(30);S.reset();S.pos.y=S.hT(0,0)/1000+.15;run(150);S.AUTO.on=false;await S.runCommand('move 80 cm forward');let t=0;while(S.AUTO.on&&t<60*60){run(1);t++;}run(90);R['walk80_t'+amp]={x:Math.round(S.pos.x*1000),up:+new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y.toFixed(2),secs:+(t/60).toFixed(1)};}
  S.setT(0);run(30);
  // gripping: pick up each small object with each claw from a clean start
  const names=['red cube','teal ball','yellow cube','blue ball','green cube','pink ball'];R.pick={};
  for(const n of names)for(const claw of ['left','right']){globalThis.__fail='';S.setT(0);run(30);S.reset();run(150);await S.runCommand('pick up the '+n+' with your '+claw+' claw');let t=0;while(S.AUTO.on&&t<90*60){run(1);t++;}run(30);
    R.pick[n+'/'+claw]={held:S.HOLD[claw==='left'?0:1]>=0,secs:+(t/60).toFixed(1),fail:globalThis.__fail||''};}
  const j=arg('json',null);if(j)require('fs').writeFileSync(j,JSON.stringify(R,null,1));console.log(JSON.stringify(R));process.exit(0);})();
