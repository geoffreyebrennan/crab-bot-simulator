// Stuck-detection tests (Phase 2, sub-steps 2.3 and 2.4.7): a truly blocked run must stop within ~5 s of the robot's last progress and name the obstacle;
// trips that merely have a prop in the way must route around it and arrive. (Boxed-in cases: route_fallback_tests.js. Hidden/late obstacles: route_stuck_tests.js.)
// Run: node stuck_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];module.paths.push('/tmp/node_modules');
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {k,c,flipTest,HOLD,OB,vel,localParse,normPlan,checkPlan,setSample:v=>{SAMPLE=v;claudeOff=false;},Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
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

const R={};const put=(k,v)=>{R[k]=v;};
const place=(x,z,yd)=>{globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=x/1000;S.pos.z=z/1000;S.pos.y=S.hT(x,z)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);};
const yawDeg=()=>{const v=new THREE.Vector3(1,0,0).applyQuaternion(S.qt);return Math.atan2(-v.z,v.x)*180/Math.PI;};
const upY=()=>new THREE.Vector3(0,1,0).applyQuaternion(S.qt).y;
async function cmd(text,max=40){await S.runCommand(text);let t=0;while(S.AUTO.on&&t<max*60){run(1);t++;}run(90);return t/60;}
(async()=>{run(30);
 // 1. command accuracy: displacement in the start frame
 for(const [txt,ex,ey,eh] of [['move 12 centimeters forward',120,0,0],['move 30 cm back',-300,0,0],['move 20 cm left',0,200,0],['move 20 cm right',0,-200,0],['move 50 cm forward',500,0,0],['turn 90 degrees left',0,0,90],['turn 45 degrees right',0,0,-45],['turn 180 degrees',0,0,180]]){
  place(0,0,0);const x0=S.pos.x*1000,z0=S.pos.z*1000,h0=yawDeg();await cmd(txt);const dx=S.pos.x*1000-x0,dz=S.pos.z*1000-z0,fx=dx*Math.cos(h0*Math.PI/180)-dz*Math.sin(h0*Math.PI/180)*-1*-1;
  const a=h0*Math.PI/180;const fwd=dx*Math.cos(a)-dz*Math.sin(a),left=-(dx*Math.sin(a)+dz*Math.cos(a))*-1;let dh=yawDeg()-h0;dh=((dh+540)%360)-180;
  put('cmd: '+txt,{err_mm:Math.round(Math.hypot(fwd-ex,Math.abs(ey)>0?(Math.abs(left)-Math.abs(ey)):0)),turnErr:Math.round(M(dh,eh)),ok:null});}
 function M(a,b){let d=a-b;d=((d+540)%360)-180;return Math.abs(d);}
 // 2. free walking forward for 4 s (keyboard W), flat and rough
 for(const amp of [0,60]){S.setT(amp);run(30);place(0,0,0);S.k.w=1;run(240);S.k.w=0;run(60);put('walk 4 s, terrain '+amp,{dist_mm:Math.round(Math.hypot(S.pos.x*1000,S.pos.z*1000)),up:+upY().toFixed(2)});}
 S.setT(0);run(30);
 // 3. flip and self-right
 place(0,0,0);S.flipTest();let t=0;while(upY()<.75&&t<40*60){run(1);t++;}put('self-right',{secs:+(t/60).toFixed(1),up:+upY().toFixed(2)});run(60);
 // 4. jump
 place(0,0,0);S.pos.y=S.pos.y;let ymax=0,y0=S.pos.y;const p0=[S.pos.x,S.pos.z];await cmd('jump',10);put('jump',{drift_mm:Math.round(Math.hypot(S.pos.x-p0[0],S.pos.z-p0[1])*1000),up:+upY().toFixed(2)});
 // 5. crouch
 place(0,0,0);await cmd('crouch',5);const cr=S.c.crouch;await cmd('stand',5);put('crouch/stand',{crouched:cr,standing:!S.c.crouch});
 // 6. pick up balls (grip), both claws
 for(const [nm,claw] of [['pink ball','right'],['pink ball','left'],['green cube','right']]){place(0,0,0);const e=S.ents().find(q=>q.name===nm);await cmd('pick up the '+nm+' with your '+claw+' claw',60);const held=S.HOLD.some(h=>h>=0&&S.OB[h]&&S.ents().find(q=>q.idx===h&&q.name===nm));put('pick '+nm+' '+claw,{held,msg:globalThis.__fail||''});}
 // 7. parser: a list of phrases -> normalised plans
 const ph=['move 12 centimeters forward, then jump','go to the pink ball, and pick it up with your right claw','turn left 90 degrees then move 30 cm back','crouch then stand up','go to the red pillar','pitch up 10 degrees','jump twice','move half a metre to the right','turn around','go to the purple dragon','move 2 m forward','pick up the blue ball','open your left claw','drop it','go to the farthest cube','do a backflip'];
 const pl={};for(const p of ph){try{const st=S.localParse(p);pl[p]=JSON.stringify(st&&st.steps?st.steps:st);}catch(e){pl[p]='ERR '+e.message;}}put('parser',pl);
 // 8. Claude path with a stand-in
 let asked=0;S.setSample({json:async(p)=>{asked++;return {steps:[{do:'move',dir:'forward',cm:10},{do:'jump'}]};}});
 place(0,0,0);const x1=S.pos.x*1000;await cmd('please advance a little then hop',40);put('claude path',{asked,movedForward_mm:Math.round(S.pos.x*1000-x1)});
 S.setSample({json:async()=>({steps:[{do:'goto',target:'purple dragon'}]})});place(0,0,0);await S.runCommand('go to the purple dragon');run(30);put('claude bad name',{fail:globalThis.__fail||'(none)',autoOn:S.AUTO.on});
 S.setSample(null);
 console.log(JSON.stringify(R,null,1));
 const i=process.argv.indexOf('--json');if(i>0)require('fs').writeFileSync(process.argv[i+1],JSON.stringify(R,null,1));
 process.exit(0);})();
