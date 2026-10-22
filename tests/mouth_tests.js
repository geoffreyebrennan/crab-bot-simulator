// Mouth feedback (Phase 5, sub-step 5.6): the LED mouth must follow what the crab does. Run: node mouth_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
code=code.replace('function failStep(msg){','function failStep(msg){globalThis.__fail=msg;');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {getMouth:()=>mouthName,getThink:()=>mouthThink,failStep,flashMouth,flipTest,localParse,HOLD,OB,c,Q,pos,qt,reset,runCommand,AUTO,relXY,ents,hT,setT:v=>{Tamp=v;terrDirty=true;}};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
let pass=0,fail=0;const T=(ok,m)=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+m);};
const seen=new Set();let tt=0;
// watch the mouth for up to maxF frames while a command runs
async function watch(cmd,maxF=60*60,opt={}){seen.clear();S.reset();S.flashMouth('',0);run(2);const p=S.runCommand(cmd);const thinkNow=S.getThink();await p;let f=0;while((S.AUTO.on||f<5)&&f<maxF){run(1);seen.add(S.getMouth());f++;}return {thinkNow,secs:f/60};}
(async()=>{run(30);
 run(60);T(S.getMouth()==='idle','idle at rest ('+S.getMouth()+')');
 {const r=await watch('move 20 cm forward');T(r.thinkNow,'thinking while the command is planned');T(seen.has('walk'),'walking shows the walk mouth ('+[...seen]+')');run(120);T(S.getMouth()==='idle','idle again after the move ('+S.getMouth()+')');}
 {await watch('jump');T(seen.has('jump'),'jump shows the jump mouth ('+[...seen]+')');}
 {await watch('pick up the pink ball');T(seen.has('grip'),'reaching and closing shows the grip mouth ('+[...seen]+')');run(5);T(S.getMouth()==='carry','carrying shows the carry mouth ('+S.getMouth()+')');}
 {S.reset();S.flashMouth('',0);await S.runCommand('pick up the pink ball and put it in the basket');seen.clear();let f=0;while(S.AUTO.on&&f<60*90){run(1);seen.add(S.getMouth());f++;}
  T(seen.has('happy'),'a drop in the basket shows the happy mouth ('+[...seen]+')');run(60*5);T(S.getMouth()==='idle','back to idle a few seconds later ('+S.getMouth()+')');}
 {await watch('pick up the red cube, then the green cube, then the blue ball');T(seen.has('error')||S.getMouth()==='error','a failed step shows the error mouth ('+[...seen]+')');}
 {S.reset();S.flashMouth('idle',0);S.AUTO.steps=[{do:'wait',s:5}];S.AUTO.i=0;S.AUTO.on=true;S.failStep('Something is in the way: the red pillar. I stopped 40 cm from the red cube.');run(5);T(S.getMouth()==='blocked','being blocked shows the blocked mouth ('+S.getMouth()+')');run(60*5);T(S.getMouth()==='idle','and clears after a few seconds ('+S.getMouth()+')');}
 console.log('mouth feedback 5.6:',pass,'passed,',fail,'failed');process.exit(fail?1:0);})();
