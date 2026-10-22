// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {ang,mInk,setT:v=>{Tamp=v;terrDirty=true;},c,legs,NL,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const names=['hipServo','coxa','femServo','femur','tibServo','tibia'];


const lo=[[1e9,-1e9],[1e9,-1e9],[1e9,-1e9]];const rng=[0,1,2,3,4,5,6,7].map(()=>[[1e9,-1e9],[1e9,-1e9],[1e9,-1e9]]);
const knr=[0,1,2,3,4,5,6,7].map(()=>[1e9,-1e9]);function track(){for(let i=0;i<8;i++){const kn=180-(S.ang[i][1]-S.ang[i][2])*180/Math.PI;knr[i][0]=Math.min(knr[i][0],kn);knr[i][1]=Math.max(knr[i][1],kn);}for(let i=0;i<8;i++)for(let j=0;j<3;j++){const v=S.ang[i][j]*180/Math.PI;rng[i][j][0]=Math.min(rng[i][j][0],v);rng[i][j][1]=Math.max(rng[i][j][1],v);}}
async function scen(cmd,amp,pre){S.setT(amp);S.reset();run(150);if(pre)pre();let f=0;if(cmd)await S.runCommand(cmd);while(((cmd&&S.AUTO.on)||f<120)&&f<1800){run(1);track();f++;}}
(async()=>{
 await scen(null,0);await scen('move 60 centimeters forward',0);await scen('move 40 centimeters back',0);await scen('move 40 centimeters left',60);await scen('turn left 180 degrees',0);await scen('move 50 centimeters forward',60);
 await scen('jump',0);await scen(null,0,()=>{S.c.crouch=true});await scen('go to the ramp',0);await scen('go to the top of the ramp',0);
 await scen(null,0,()=>{S.c.pitch=20});await scen(null,0,()=>{S.c.pitch=-20});await scen(null,0,()=>{S.c.roll=8});
 console.log('knee interior angle (180 = straight) min..max per leg:',knr.map((r,i)=>i+': '+r[0].toFixed(0)+'..'+r[1].toFixed(0)).join('   '));console.log('joint ranges in degrees [hip, femur, tibia] min..max (walking legs 1-6; arms 0 and 7):');
 [0,1,2,3,4,5,6,7].forEach(i=>console.log('leg',i,rng[i].map(r=>r[0].toFixed(0)+'..'+r[1].toFixed(0)).join('   ')));
})();
