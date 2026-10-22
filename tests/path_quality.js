// Path-following quality (Phase 2, sub-step 2.4.5): arrival time, path efficiency, cross-track error, heading jitter and clearance on routed trips.
// Run: node path_quality.js [--html path]
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

let TT=0;const base=o=>o.kind==='pillar'?60:85;
async function trip(label,pose,props,cmd,tgtName,lim){
  globalThis.__fail='';S.reset();if(props)place(props);S.Q.col=true;S.pos.x=pose[0]/1000;S.pos.z=pose[1]/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),pose[2]*Math.PI/180);run(150);
  const e=S.ents().find(q=>q.name===tgtName),obs=S.ents().filter(o=>!o.small&&o.name!==tgtName&&o.x<5000);
  await S.runCommand(cmd);let t=0,len=0,lx=S.pos.x*1000,lz=S.pos.z*1000,flips=0,lastSign=0,minEdge=1e9,xt=0,route=null,r0=null;
  while(S.AUTO.on&&t<90*60){run(1);t++;const x=S.pos.x*1000,z=S.pos.z*1000;if(t%15===0){len+=Math.hypot(x-lx,z-lz);lx=x;lz=z;}
    const w=S.AUTO.w;if(Math.abs(w)>.35){const sg=Math.sign(w);if(lastSign&&sg!==lastSign)flips++;lastSign=sg;}
    for(const o of obs)minEdge=Math.min(minEdge,Math.hypot(x-o.x,z-o.z)-base(o));
    const a=S.AUTO.s;if(a&&a.rt){route=a.rt.pts;if(!r0)r0=route.map(p=>p.slice());
      let bd=1e9;for(let q=0;q<route.length-1;q++){const A=route[q],B=route[q+1],dx=B[0]-A[0],dz=B[1]-A[1],L2=dx*dx+dz*dz||1,u=Math.max(0,Math.min(1,((x-A[0])*dx+(z-A[1])*dz)/L2));bd=Math.min(bd,Math.hypot(x-A[0]-u*dx,z-A[1]-u*dz));}
      if(t>120)xt=Math.max(xt,bd);}}
  run(30);const [xb,yb]=S.relXY(e.x,e.z),d=Math.hypot(xb,yb),ok=!globalThis.__fail&&d<=lim.stop+30&&Math.abs(Math.atan2(yb,xb))<.21;
  let rl=0;if(r0)for(let q=1;q<r0.length;q++)rl+=Math.hypot(r0[q][0]-r0[q-1][0],r0[q][1]-r0[q-1][1]);
  const eff=rl?len/rl:0,secs=t/60;TT+=secs;const _x=0,speed=rl/secs;
  const bad=[];if(!ok)bad.push('did not arrive '+JSON.stringify(globalThis.__fail));const corners=r0?Math.max(0,r0.length-2):0;if(flips>corners*2+3)bad.push('heading flips '+flips);if(minEdge<lim.edge)bad.push('edge clearance '+Math.round(minEdge));if(xt>lim.xt)bad.push('cross-track '+Math.round(xt));if(speed<lim.speed)bad.push('avg speed '+Math.round(speed));
  chk(!bad.length,label+': '+bad.join('; '));
  console.log((bad.length?'FAIL ':'PASS ')+label.padEnd(34)+'| '+secs.toFixed(1).padStart(5)+' s | path '+Math.round(len)+' mm (first route '+Math.round(rl)+') | route speed '+Math.round(speed)+' mm/s | flips '+flips+' | max off-route '+Math.round(xt)+' | min edge gap '+Math.round(minEdge)+(bad.length?' | '+bad.join('; '):''));}
(async()=>{run(30);const pb=S.ents().find(q=>q.name==='pink ball');
  const L={stop:280,flips:0,edge:90,xt:260,speed:70};
  await trip('blue block from A',[0,0,0],null,'go to the blue block','blue block',{...L,stop:360});
  await trip('purple pillar from A',[0,0,0],null,'go to the purple pillar','purple pillar',{...L,stop:360});
  await trip('teal ball from C',[800,1400,180],null,'go to the teal ball','teal ball',L);
  await trip('orange pillar from B',[-1200,-900,0],null,'go to the orange pillar','orange pillar',{...L,stop:360});
  await trip('green cube from F',[-900,400,-135],null,'go to the green cube','green cube',L);
  await trip('red cube from D',[-200,-1500,90],null,'go to the red cube','red cube',L);
  await trip('ring with one gap',[-1200,0,0],ring(pb.x,pb.z,600,8,true),'go to the pink ball','pink ball',L);
  const gx=pb.x-700,gz=pb.z;
  await trip('narrow gap between two props',[gx-900,gz,0],[[gx,gz-330],[gx,gz+330]],'go to the pink ball','pink ball',L);
  console.log('total time',TT.toFixed(1),'s');out.forEach(o=>console.log(o));console.log('path quality:',pass,'checks passed,',fail,'failed');process.exit(fail?1:0);
})();
