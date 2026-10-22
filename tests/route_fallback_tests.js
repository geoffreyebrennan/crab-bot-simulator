// Route fallback tests (Phase 2, sub-step 2.4.4): boxed-in targets/robots get a message naming the obstacles; narrow-but-open gaps are still driven through.
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
(async()=>{run(30);
  const pink=S.ents().find(q=>q.name==='pink ball');
  // 1. target boxed in by a full ring of props
  const pb=[S.ents().find(q=>q.name==='pink ball')];
  await go('target boxed in by 6 props',[-1200,0,0],ring(pb[0].x,pb[0].z,330,6),'go to the pink ball','pink ball',o=>(o.msg&&/boxed in by/.test(o.msg)&&/the (red|teal|yellow|blue|orange|green|purple|sky blue) (pillar|block)/.test(o.msg)&&o.moved<150&&o.t<3)||('message '+JSON.stringify(o.msg)+', moved '+Math.round(o.moved)+', '+o.t.toFixed(1)+' s'));
  // 2. robot boxed in
  await go('robot boxed in by 6 props',[-1200,0,0],ring(-1200,0,420,6),'go to the pink ball','pink ball',o=>(o.msg&&/(find a way out|boxed in)/.test(o.msg)&&o.moved<150&&o.t<3)||('message '+JSON.stringify(o.msg)+', moved '+Math.round(o.moved)+', '+o.t.toFixed(1)+' s'));
  // 3. ring around target with one wide gap: must still arrive
  await go('target ring with a wide gap',[-1200,0,0],ring(pb[0].x,pb[0].z,600,8,true),'go to the pink ball','pink ball',o=>(!o.msg&&o.d<=280)||('message '+JSON.stringify(o.msg)+', dist '+Math.round(o.d)));
  // 4. a two-prop wall with a narrow (but wide enough) gap between the robot and the ball
  const gx=pb[0].x-700,gz=pb[0].z;
  await go('narrow gap between two props',[gx-900,gz,0],[[gx,gz-330],[gx,gz+330]],'go to the pink ball','pink ball',o=>(!o.msg&&o.d<=280)||('message '+JSON.stringify(o.msg)+', dist '+Math.round(o.d)));
  out.forEach(o=>console.log(o));console.log('route fallback:',pass,'checks passed,',fail,'failed');process.exit(fail?1:0);
})();
