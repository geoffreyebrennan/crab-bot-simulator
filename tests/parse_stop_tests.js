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


const J=JSON.stringify;pass=0;fail=0;
const eq=(t,want)=>{const got=S.localParse(t);if(J(got)===J(want))pass++;else{fail++;console.log('FAIL '+t+'\n   want '+J(want)+'\n   got  '+J(got));}};
const GOTO=(target,gap)=>({do:'goto',target,...(gap===undefined?{}:{gap_cm:gap})});
(async()=>{run(30);S.reset();run(30);
 eq('go to the pink ball',[GOTO('pink ball')]);
 eq('go to the pink ball and stop 30 cm from it',[GOTO('pink ball',30)]);
 eq('go to the pink ball, stopping 30 cm away',[GOTO('pink ball',30)]);
 eq('go to the red pillar and stay 50 cm away from it',[GOTO('red pillar',50)]);
 eq('go 40 cm from the teal block',[GOTO('teal block',40)]);
 eq('walk 2 meters from the purple pillar',[GOTO('purple pillar',200)]);
 eq('go to within 20 cm of the pink ball',[GOTO('pink ball',20)]);
 eq('go 300 mm from the red pillar',[GOTO('red pillar',30)]);
 eq('go next to the red pillar',[GOTO('red pillar',0)]);
 eq('go beside the pink ball',[GOTO('pink ball',0)]);
 eq('go close to the green block',[GOTO('green block',0)]);
 eq('stop 30 cm from the pink ball',[GOTO('pink ball',30)]);
 eq('move 30 cm forward',[{do:'move',dir:'forward',cm:30}]);
 eq('move 12 cm forward, then jump',[{do:'move',dir:'forward',cm:12},{do:'jump'}]);
 eq('go to the pink ball then move 20 cm back',[GOTO('pink ball'),{do:'move',dir:'back',cm:20}]);
 eq('go to the pink ball and pick it up with your right claw',[{do:'pick',target:'pink ball',claw:'right'}]);
 eq('go to the blue block and then jump',[GOTO('blue block'),{do:'jump'}]);
 const FACE=(t,a)=>({do:'face',target:t,...(a?{away:true}:{})});
 eq('face the red pillar',[FACE('red pillar')]);
 eq('look at the pink ball',[FACE('pink ball')]);
 eq('turn toward the blue block',[FACE('blue block')]);
 eq('turn to face the green cube',[FACE('green cube')]);
 eq('point at the teal ball',[FACE('teal ball')]);
 eq('face away from the red pillar',[FACE('red pillar',true)]);
 eq('face the red pillar then go to it',[FACE('red pillar'),GOTO('red pillar')]);
 eq('go to the pink ball and face the red pillar',[GOTO('pink ball'),FACE('red pillar')]);
 eq('turn towards the purple pillar and move 20 cm forward',[FACE('purple pillar'),{do:'move',dir:'forward',cm:20}]);
 eq('turn 90 degrees left',[{do:'turn',deg:90}]);
 eq('turn around',[{do:'turn',deg:180}]);
 eq('face left',[{do:'turn',deg:90}]);
 eq('face the purple dragon',[]);
 console.log('stop-distance and face parsing:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();