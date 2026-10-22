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
// Chained commands (Phase 2, sub-step 2.8): "go to the A, then go to the B" and friends, across terrain roughness and start poses.
//   node chain_tests.js [--html path] [--terrain 0,30,60] [--poses A,C,F] [--quick]
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const POSES={A:[0,0,0],C:[800,2100,180],F:[-900,400,-135]},quick=process.argv.includes('--quick');
const PAIRS=[['pink ball','red pillar'],['red pillar','teal block'],['green cube','blue ball'],['orange pillar','pink ball'],['teal ball','purple pillar'],['yellow cube','green block'],['blue block','teal ball'],['purple pillar','yellow pillar']];
const SHAPES=[(a,b)=>`go to the ${a}, then go to the ${b}`,(a,b)=>`go to the ${a} and stop 30 cm from it, then go to the ${b}`,(a,b)=>`go to the ${a}, face the ${b}, then go to the ${b}`,(a,b)=>`go to the ${a}, turn left 90 degrees, then go to the ${b}`];
const tl=String(arg('terrain','0,30,60')).split(',').map(Number),pl=String(arg('poses','A,C,F')).split(',');
const stopOf=e=>e.small?250:360;
(async()=>{run(30);let pass=0,total=0;const fails=[],byT={};
 const pairs=quick?PAIRS.slice(0,4):PAIRS,shapes=quick?SHAPES.slice(0,2):SHAPES;
 for(const T of tl){S.setT(T);run(30);byT[T]=[0,0];
  for(const pn of pl)for(const [a,b] of pairs)for(let si=0;si<shapes.length;si++){
   const [sx,sz,yd]=POSES[pn];globalThis.__fail='';S.Q.col=true;S.reset();S.pos.x=sx/1000;S.pos.z=sz/1000;S.pos.y=S.hT(sx,sz)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),yd*Math.PI/180);run(150);
   const ea=S.ents().find(q=>q.name===a),eb=S.ents().find(q=>q.name===b);if(Math.hypot(sx-ea.x,sz-ea.z)<500)continue;
   const cmd=shapes[si](a,b);await S.runCommand(cmd);let t=0,hitA=false;
   while(S.AUTO.on&&t<150*60){run(1);t++;const[xa,ya]=S.relXY(ea.x,ea.z);if(!hitA&&Math.hypot(xa,ya)<=(si===1?125+(ea.small?ea.r:70)+300+80:stopOf(ea)+70))hitA=true;}
   run(60);const[xb,yb]=S.relXY(eb.x,eb.z),d=Math.hypot(xb,yb),br=Math.abs(Math.atan2(yb,xb))*180/Math.PI,msg=globalThis.__fail;
   const ok=!msg&&hitA&&d<=stopOf(eb)+45&&br<12;total++;byT[T][1]++;if(ok){pass++;byT[T][0]++;}else fails.push(`terrain ${T} pose ${pn} shape ${si} "${cmd}": ${msg?msg:(!hitA?'never reached the first target':'ended '+Math.round(d)+' mm from '+b+', bearing '+Math.round(br))} (${(t/60).toFixed(0)} s)`);
  }}
 fails.forEach(f=>console.log('FAIL '+f));
 for(const T of tl)console.log(`terrain ${T} mm: ${byT[T][0]}/${byT[T][1]} (${Math.round(100*byT[T][0]/Math.max(1,byT[T][1]))}%)`);
 console.log(`chains: ${pass} of ${total} (${Math.round(100*pass/total)}%)`);process.exit(0);})();
