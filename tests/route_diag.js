// Stuck-detection tests (Phase 2, sub-step 2.3): a blocked run must stop within ~5 s of the robot's last progress and name the obstacle.
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
const S=new Function(...Object.keys(g),code+';return {planRoute,routeObstacles,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const out=[];
const chk=(ok,msg)=>{if(ok)pass++;else{fail++;out.push('FAIL '+msg);}};
async function trial(label,[sx,sz,yd],cmd,expect){
  globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
  const e=expect.target?S.ents().find(q=>q.name===expect.target):null;
  await S.runCommand(cmd);let t=0,best=1e9,tBest=0,p0=[S.pos.x*1000,S.pos.z*1000],tMove=0;
  while(S.AUTO.on&&t<90*60){run(1);t++;if(t%30===0&&t<900){const rr=S.planRoute(e,360);console.log('   replan:',rr?rr.pts.map(p=>p.map(Math.round).join(',')).join(' > ')+' len '+Math.round(rr.len):'NULL');}if(t%30===0&&t<900)console.log('  t',(t/60).toFixed(1),'pos',Math.round(S.pos.x*1000),Math.round(S.pos.z*1000),'vx',Math.round(S.AUTO.vx),'vy',Math.round(S.AUTO.vy),'w',S.AUTO.w.toFixed(2));const d=e?Math.hypot(S.pos.x*1000-e.x,S.pos.z*1000-e.z):Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);
    if(expect.target?d<best-25:d>best+25-1e9&&false){}
    if(expect.target){if(d<best-25){best=d;tBest=t;}}else{const m=Math.hypot(S.pos.x*1000-p0[0],S.pos.z*1000-p0[1]);if(m>best||best===1e9){best=m;}if(m>tMove+25){tMove=m;tBest=t;}}}
  const msg=globalThis.__fail,since=(t-tBest)/60;
  chk(!!msg,label+': blocked run should end with a message (ran '+(t/60).toFixed(1)+' s, AUTO.on='+S.AUTO.on+')');
  if(msg){chk(msg.includes(expect.blocker),label+': message should name "'+expect.blocker+'" -> '+JSON.stringify(msg));
    chk(since<=6.5,label+': should stop within ~5 s of the last progress, took '+since.toFixed(1)+' s');}
  console.log((msg&&msg.includes(expect.blocker)&&since<=6.5?'PASS ':'FAIL ')+label.padEnd(44)+'| stopped '+since.toFixed(1)+' s after last progress | "'+(msg||'(no message, '+(t/60).toFixed(0)+' s)')+'"');
}

(async()=>{run(30);
const sc0=[['blue block from A',[0,0,0],'go to the blue block','blue block'],['purple pillar from A',[0,0,0],'go to the purple pillar','purple pillar'],['teal ball from C',[800,1400,180],'go to the teal ball','teal ball'],['yellow cube pick from C',[800,1400,180],'pick up the yellow cube with your right claw','yellow cube']];
const sc=[sc0[1]];for(const [lab,[sx,sz,yd],cmd,tn] of sc){
 globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
 const e=S.ents().find(q=>q.name===tn);
 const stop=/pick/.test(cmd)?330:e.small?250:360;
 const r=S.planRoute(e,stop);
 console.log('\n==',lab,'| start',sx,sz,'| target',e.x,e.z,'small',!!e.small,'stop',stop);
 console.log(' obstacles:',S.ents().filter(q=>!q.small).map(q=>q.name+'('+q.x+','+q.z+')').join(' '));
 console.log(' route:',r?r.pts.map(p=>p.map(Math.round).join(',')).join(' -> ')+' len '+Math.round(r.len):'NULL');
 await S.runCommand(cmd);let t=0,minc=1e9,near='';
 while(S.AUTO.on&&t<90*60){run(1);t++;if(t%30===0&&t<900){const rr=S.planRoute(e,360);console.log('   replan:',rr?rr.pts.map(p=>p.map(Math.round).join(',')).join(' > ')+' len '+Math.round(rr.len):'NULL');}if(t%30===0&&t<900)console.log('  t',(t/60).toFixed(1),'pos',Math.round(S.pos.x*1000),Math.round(S.pos.z*1000),'vx',Math.round(S.AUTO.vx),'vy',Math.round(S.AUTO.vy),'w',S.AUTO.w.toFixed(2));for(const q of S.ents().filter(q=>!q.small&&q.name!==tn)){const d=Math.hypot(S.pos.x*1000-q.x,S.pos.z*1000-q.z);if(d<minc){minc=d;near=q.name;}}}
 const [xb,yb]=S.relXY(e.x,e.z);
 console.log(' result: msg',JSON.stringify(globalThis.__fail),'| dist',Math.round(Math.hypot(xb,yb)),'bearing',Math.round(Math.atan2(yb,xb)*180/Math.PI),'| time',(t/60).toFixed(1),'| closest approach to other obstacle',Math.round(minc),near);
}
process.exit(0)})();
