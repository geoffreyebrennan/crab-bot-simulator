// Pick retry tests (Phase 3, sub-step 3.5): a grip that misses once is retried and succeeds; a pick that cannot succeed gives up after 3 tries with a plain message.
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
const S=new Function(...Object.keys(g),code+';return {yawOf,relXY,legs,cj,NL,jawGap,JC,JR,DG,gapCenter,HOLD,flipTest,localParse,HOLD,OB,c,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
// Pick-up tests (Phase 3, sub-step 3.1): every small object x both claws x start poses x terrain. A pick passes when the object is still in the claw
// 2 s after the step ends. Failures are binned by the phase they died in (0 approach, 1 line-up, 2 reach, 3 close, 4 lift).
const scen=async(n,claw,mode)=>{const k=claw==='left'?0:1;S.Q.col=true;S.reset();S.pos.x=.8;S.pos.z=1.4;S.pos.y=S.hT(800,1400)/1000+.15;S.qt.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);run(400);
 const e=S.ents().find(q=>q.name===n),o=S.OB[e.idx];globalThis.__fail='';await S.runCommand('pick up the '+n+' with your '+claw+' claw');
 let t=0,kicked=0,lastK=-1;while(S.AUTO.on&&t<150*60){run(1);t++;const s=S.AUTO.s;
  if(s&&s.ph===3&&o.held<0&&s.t3!==lastK&&(mode==='never'||(mode==='once'&&!kicked&&!s.tries))){lastK=s.t3;o.p.z+=120;o.m.position.copy(o.p);o.v.set(0,0,0);kicked++;} // knocks the object out from between the jaws
  if(s&&s.ph>=1&&s.ph<=2&&mode==='never'&&s.tries>=1&&o.held<0){} }
 run(120);return{n,claw,mode,held:S.HOLD[k]===e.idx,tries:(S.AUTO.s&&S.AUTO.s.tries)||0,msg:globalThis.__fail,secs:+(t/60).toFixed(1),kicked};};
(async()=>{run(30);S.setT(0);run(30);let bad=0;
 for(const [n,c,m] of [['red cube','left','once'],['teal ball','right','once'],['green cube','right','once'],['pink ball','left','never'],['yellow cube','right','never']]){
  const r=await scen(n,c,m);console.log(JSON.stringify(r));
  const good=m==='once'?(r.held&&!r.msg):(!r.held&&/after 3 tries/.test(r.msg||''));if(!good){bad++;console.log('  ^ UNEXPECTED');}}
 console.log(bad?bad+' scenario(s) unexpected':'all retry scenarios behave');process.exit(0);})();
