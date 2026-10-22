// Repeatable "go to the X" survey for the Virtual Hexapod page (Phase 2, sub-step 2.1).
// Runs the page's own physics headlessly in Node: every object x every start pose x each terrain roughness.
//   node goto_survey.js [--html path] [--terrain 0,30,60] [--poses A,B,C,D,E,F] [--targets "pink ball,red pillar"]
//                       [--out results.json] [--budget 240] [--verb "go to the"] [--summary]
// Needs: npm i three@0.128.0   (the page's own three.js version). Resumable: reruns skip finished cases and stop after --budget seconds.
module.paths.push('/tmp/node_modules');
const fs=require('fs');
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:(process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:true);};
const HTML=arg('html','/mnt/user-data/outputs/hexapod.html'),OUT=arg('out','/mnt/user-data/outputs/tests/goto_survey.json'),BUDGET=+arg('budget',240),VERB=arg('verb','go to the');
const TERR=String(arg('terrain','0,30,60')).split(',').map(Number),POSES=String(arg('poses','A,B,C,D,E,F')).split(',');
const POSEDEF={A:[0,0,0],B:[-1200,-900,0],C:[800,1400,180],D:[-200,-1500,90],E:[200,-250,270],F:[-900,400,-135]}; // x mm, z mm, heading deg (0 = facing +x, positive = turned left)
const TARGETS=arg('targets',null)?String(arg('targets')).split(','):null;
const THREE=require('three');
let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {Q,pos,qt,reset,runCommand,AUTO,yawOf,relXY,ents,resolve,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let i=0;i<n;i++){frames++;cb();}};
let results=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):[];
const key=r=>[r.terrain,r.pose,r.target,r.verb].join('|');
function summary(rs){
  const pct=(a,b)=>b?(100*a/b).toFixed(0)+'%':'-',by=(f)=>{const m={};rs.forEach(r=>{const k=f(r);(m[k]=m[k]||[0,0]);m[k][1]++;if(r.ok)m[k][0]++;});return m;};
  console.log('\n== go-to survey: '+rs.filter(r=>r.ok).length+' of '+rs.length+' succeeded ('+pct(rs.filter(r=>r.ok).length,rs.length)+') ==');
  for(const [t,a] of Object.entries(by(r=>'terrain '+r.terrain+' mm')))console.log('  '+t.padEnd(18),a[0]+'/'+a[1],pct(a[0],a[1]));
  console.log('  by start pose:   '+Object.entries(by(r=>r.pose)).map(([k,a])=>k+' '+a[0]+'/'+a[1]).join('  '));
  console.log('  by target:');for(const [t,a] of Object.entries(by(r=>r.target)))console.log('    '+t.padEnd(14),a[0]+'/'+a[1]);
  const cat={};rs.filter(r=>!r.ok).forEach(r=>cat[r.outcome]=(cat[r.outcome]||0)+1);console.log('  failure kinds:',JSON.stringify(cat));
  const ts=rs.filter(r=>r.ok).map(r=>r.secs).sort((a,b)=>a-b);if(ts.length)console.log('  time of successes: median',ts[ts.length>>1],'s, slowest',ts[ts.length-1],'s');
  const bad=rs.filter(r=>r.outcome==='WRONG_NAME');if(bad.length)console.log('  name matched the wrong object:',[...new Set(bad.map(r=>r.target+' -> '+r.resolvedTo))].join('; '));
}
if(arg('summary',false)){summary(results);process.exit(0);}
(async()=>{
  const t0=Date.now();let done=0;
  S.Q.col=true;
  for(const amp of TERR){
    S.setT(amp);run(30);
    const names=S.ents().map(e=>e.name).filter(n=>!TARGETS||TARGETS.includes(n));
    for(const pose of POSES){for(const nm of names){
      const rec={terrain:amp,pose,target:nm,verb:VERB};if(results.some(r=>key(r)===key(rec)))continue;
      if((Date.now()-t0)/1000>BUDGET){fs.writeFileSync(OUT,JSON.stringify(results));console.log('budget reached after',done,'new cases; rerun to continue (',results.length,'stored )');summary(results.filter(r=>TERR.includes(r.terrain)));return;}
      const [sx,sz,yd]=POSEDEF[pose];globalThis.__fail='';S.reset();
      S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=S.hT(sx,sz)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
      const e=S.ents().find(q=>q.name===nm),resolved=S.resolve(VERB+' '+nm);
      await S.runCommand(VERB+' '+nm);
      let t=0,stalled=false,hx=S.pos.x*1000,hz=S.pos.z*1000,th=0;
      while(S.AUTO.on&&t<70*60){run(1);t++;if(t%60===0){const x=S.pos.x*1000,z=S.pos.z*1000;if(Math.hypot(x-hx,z-hz)>100){hx=x;hz=z;th=t;}if(t-th>20*60){stalled=true;break;}}} // stalled = the robot has not moved 10 cm in 20 s (a detour may legitimately move away from the target)
      run(60);if(S.AUTO.on)S.cancelPlan&&0;
      const [xb,yb]=S.relXY(e.x,e.z),d=Math.hypot(xb,yb),br=Math.atan2(yb,xb)*180/Math.PI,stop=e.small?250:360,msg=globalThis.__fail||'';
      const arrived=!msg&&d<=stop+30&&Math.abs(br)<12;
      rec.pose=pose;rec.ok=!!arrived&&(!resolved||resolved.name===nm);rec.dist_mm=Math.round(d);rec.stop_mm=stop;rec.bearing_deg=Math.round(br);rec.secs=+(t/60).toFixed(1);rec.fail=msg;rec.resolvedTo=resolved?resolved.name:null;
      rec.outcome=rec.ok?'OK':resolved&&resolved.name!==nm?'WRONG_NAME':msg?'FAILMSG':stalled?'STALL':S.AUTO.on?'TIMEOUT':(d>stop+30?'ENDED_FAR':'BAD_FACING');
      if(S.AUTO.on){S.AUTO.on=false;}
      results.push(rec);done++;
      if(done%10===0)fs.writeFileSync(OUT,JSON.stringify(results));
    }}
  }
  fs.writeFileSync(OUT,JSON.stringify(results));console.log('complete:',results.length,'cases stored in',OUT);summary(results.filter(r=>TERR.includes(r.terrain)));
})();
