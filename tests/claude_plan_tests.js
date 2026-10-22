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
let MOCK=null,LASTPROMPT='';
const CL={use:()=>Promise.resolve({json:async(p)=>{LASTPROMPT=p;if(MOCK instanceof Error)throw MOCK;return MOCK;}})};
const g={window:{claude:CL},claude:CL,THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {runCommand,AUTO,reset,ents,getNotes:()=>RES_NOTES};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const chk=(ok,msg)=>{if(ok)pass++;else{fail++;console.log('FAIL '+msg);}};
// Claude-path checks (Phase 2, sub-step 2.9): what the prompt tells Claude, and how its replies are cleaned up before the robot moves.
(async()=>{run(30);S.reset();run(60);
 const ask=async(cmd,reply)=>{MOCK=reply;LASTPROMPT='';await S.runCommand(cmd);const st=S.AUTO.steps.map(x=>({...x}));S.AUTO.on=false;return st;};
 await ask('go to the red pillar',{steps:[{do:'goto',target:'red pillar'}]});
 const P=LASTPROMPT;
 chk(/red pillar \(tall pillar, about \d+ cm wide, large obstacle\), closest safe gap \d+ cm/.test(P),'prompt lists pillar size and closest safe gap');
 chk(/teal block \(block, about \d+ cm wide/.test(P),'prompt lists block size');
 chk(/pink ball \(small, about \d+ cm across, can be picked up\), closest safe gap \d+ cm/.test(P),'prompt lists small object size and gap');
 for(const w of ['gap_cm','clear space between the robot body edge','"away"','Turn around','routes around large obstacles'])chk(P.includes(w),'prompt mentions '+w);
 let st=await ask('stop 30 cm from the red pillar',{steps:[{do:'goto',target:'red pillar',gap_cm:'30 cm'}]});chk(st.length===1&&st[0].gap_cm===30,'gap_cm "30 cm" string read as 30: '+JSON.stringify(st));
 st=await ask('x',{steps:[{do:'goto',target:'red pillar',stop_cm:40}]});chk(st[0]&&st[0].gap_cm===40&&st[0].stop_cm===undefined,'stop_cm renamed to gap_cm');
 st=await ask('x',{steps:[{do:'goto',target:'red pillar',gap_cm:1}]});chk(st[0]&&st[0].gap_cm>1&&S.getNotes().length>0,'tiny gap raised to the safe minimum with a note: '+JSON.stringify(st));
 st=await ask('x',{steps:[{do:'goto',target:'red pillar',gap_cm:9999}]});chk(st[0]&&st[0].gap_cm===300,'huge gap clamped to 300');
 st=await ask('x',{steps:[{do:'face',target:'pink ball',away:true}]});chk(st[0]&&st[0].away===true,'face away kept');
 st=await ask('x',{steps:[{do:'face',target:'pink ball',away:'false'}]});chk(st[0]&&st[0].away===undefined,'away "false" is not away');
 st=await ask('x',{steps:[{do:'face',target:'pink ball',away:'true'}]});chk(st[0]&&st[0].away===true,'away "true" is away');
 st=await ask('go to the red pillar then jump',{steps:[{do:'goto',target:'red pillar'},{do:'jump'}]});chk(st.length===2&&st[1].do==='jump','chain kept in order');
 st=await ask('go to the purple dragon',{steps:[{do:'goto',target:'purple dragon'}]});chk(!st.some(x=>x.target==='purple dragon'),'an object that does not exist is never sent to the robot: '+JSON.stringify(st));
 st=await ask('go to the red pillar',new Error('boom'));chk(st.length>=1&&st[0].do==='goto','Claude error falls back to the built-in parser: '+JSON.stringify(st));
 console.log(`claude plan: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);})();
