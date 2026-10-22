// Stuck detection while following routes (Phase 2, sub-step 2.4.6): hidden obstacles are named quickly; detours and late route changes are not flagged.
// Run: node stuck_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {PR,OB,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
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

const place=(list)=>{S.PR.forEach((p,i)=>{const q=list[i]||[-2400+i*700,3200];p.x=q[0];p.z=q[1];if(p.v)p.v.set&&0;});};
const ring=(cx,cz,R,n,gap)=>{const l=[];for(let k=0;k<n;k++){if(gap&&k===0)continue;const a=k*2*Math.PI/n;l.push([cx+R*Math.cos(a),cz+R*Math.sin(a)]);}return l;};
async function go(label,pose,props,cmd,tgtName,check){
  globalThis.__fail='';S.reset();place(props);S.Q.col=true;S.pos.x=pose[0]/1000;S.pos.z=pose[1]/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),pose[2]*Math.PI/180);run(150);
  const p0=[S.pos.x*1000,S.pos.z*1000];await S.runCommand(cmd);let t=0;while(S.AUTO.on&&t<70*60){run(1);t++;}run(30);
  const e=S.ents().find(q=>q.name===tgtName),[xb,yb]=S.relXY(e.x,e.z),d=Math.hypot(xb,yb),moved=Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]),msg=globalThis.__fail;
  const r=check({msg,d,moved,t:t/60});chk(r===true,label+': '+r);console.log((r===true?'PASS ':'FAIL ')+label.padEnd(40)+'| '+(msg?JSON.stringify(msg):'arrived '+Math.round(d)+' mm')+' | moved '+Math.round(moved)+' mm, '+(t/60).toFixed(1)+' s');}

const pname=n=>S.PR.findIndex((p,i)=>S.ents().filter(e=>!e.small)[i]&&S.ents().filter(e=>!e.small)[i].name===n);
async function run1(label,pose,props,cmd,tgtName,during,check){
  globalThis.__fail='';S.reset();place(props);S.Q.col=true;S.pos.x=pose[0]/1000;S.pos.z=pose[1]/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),pose[2]*Math.PI/180);run(150);
  await S.runCommand(cmd);let t=0,best=1e9,tBest=0,p0=[S.pos.x*1000,S.pos.z*1000],dm=0,tl=0;
  const e=S.ents().find(q=>q.name===tgtName);
  while(S.AUTO.on&&t<90*60){run(1);t++;if(during)during(t);const m=Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);if(m>dm+25){dm=m;tl=t;}}
  run(30);const [xb,yb]=S.relXY(e.x,e.z),d=Math.hypot(xb,yb),msg=globalThis.__fail,since=(t-tl)/60;
  const r=check({msg,d,since,t:t/60});chk(r===true,label+': '+r);console.log((r===true?'PASS ':'FAIL ')+label.padEnd(44)+'| '+(msg?JSON.stringify(msg):'arrived '+Math.round(d)+' mm')+' | '+(t/60).toFixed(1)+' s, stopped '+since.toFixed(1)+' s after last progress');}
(async()=>{run(30);
  const pink=S.ents().find(q=>q.name==='pink ball'),blk=S.ents().filter(e=>!e.small);
  const hid=(idx,x,z,R)=>{const l=[];S.PR.forEach((p,i)=>l.push([i===idx?x:-2400+i*700,i===idx?z:3200]));return l;};
  // a. a prop that is physically much bigger than the planner thinks: stuck is detected and the prop is named
  for(const [lab,idx,name] of [['hidden big pillar on the route',0,'red pillar'],['hidden big block on the route',3,'blue block']]){
    S.reset();const P=S.PR[idx];
    await run1(lab,[-1200,0,0],hid(idx,-400,100),'go to the pink ball','pink ball',t=>{if(t===1){P.r=420;P.hx=P.hz=380;}},o=>(o.msg&&o.msg.includes(name)&&o.since<=6.5)||('message '+JSON.stringify(o.msg)+', stopped '+o.since.toFixed(1)+' s after progress'));
    P.r=60;P.hx=P.hz=60;}
  // b. a prop appears on the route after 3 s: the route changes, nobody gets flagged as stuck, the robot still arrives
  await run1('a prop pops up on the route at 3 s',[-1200,0,0],hid(0,0,3200),'go to the pink ball','pink ball',t=>{if(t===180){S.PR[0].x=-350;S.PR[0].z=60;}},o=>(!o.msg&&o.d<=300)||('message '+JSON.stringify(o.msg)+', dist '+Math.round(o.d)));
  await run1('two props pop up, one after the other',[-1200,0,0],hid(0,0,3200),'go to the pink ball','pink ball',t=>{if(t===120){S.PR[0].x=-600;S.PR[0].z=20;}if(t===420){S.PR[1].x=-150;S.PR[1].z=-60;}},o=>(!o.msg&&o.d<=300)||('message '+JSON.stringify(o.msg)+', dist '+Math.round(o.d)));
  // c. a long legitimate detour must not be flagged
  await run1('long detour around the props',[0,0,0],S.PR.map(p=>[p.x,p.z]),'go to the purple pillar','purple pillar',null,o=>(!o.msg&&o.d<=400)||('message '+JSON.stringify(o.msg)+', dist '+Math.round(o.d)));
  out.forEach(o=>console.log(o));console.log('route stuck:',pass,'checks passed,',fail,'failed');process.exit(fail?1:0);
})();
