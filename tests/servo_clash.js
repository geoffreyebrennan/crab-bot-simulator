// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {mInk,setT:v=>{Tamp=v;terrDirty=true;},c,legs,NL,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const names=['hipServo','coxa','femServo','femur','tibServo','tibia'];
function parts(L){return [L.sv[0],L.lk[0],L.sv[1],L.lk[1],L.sv[2],L.lk[2]];}
function solids(grp){const o=[];grp.updateWorldMatrix(true,true);grp.traverse(m=>{if(m.isMesh&&m.material!==S.mInk&&!(m.parent&&m.parent.isMesh&&m.material===S.mInk)&&m.geometry&&m.geometry.attributes.position){m.updateWorldMatrix(true,false);o.push(m);}});return o;}
const rc=new THREE.Raycaster();rc.firstHitOnly=false;
function inside(p,meshes){ // ray parity along three axes; returns depth estimate (min exit distance over 6 axes) or 0
  let best=1e9,votes=0;const dirs=[[1,0,0],[0,1,0],[0,0,1]];
  for(const d of dirs){let cnt=0,ex=1e9;for(const sg of [1,-1]){rc.set(p,new THREE.Vector3(...d).multiplyScalar(sg));rc.near=0;rc.far=200;const h=rc.intersectObjects(meshes,false).filter(x=>x.distance>1e-4);if(sg===1)cnt=h.length;if(h.length)ex=Math.min(ex,h[0].distance);}
    if(cnt%2===1){votes++;best=Math.min(best,ex);}}
  return votes>=2?best:0;}
function pts(meshes,step){const o=[];for(const m of meshes){const a=m.geometry.attributes.position;for(let k=0;k<a.count;k+=step){o.push(new THREE.Vector3().fromBufferAttribute(a,k).applyMatrix4(m.matrixWorld));}}return o;}
function report(tag,legsList){const res={};
  S.body.updateMatrixWorld(true);
  for(const i of legsList){const L=S.legs[i],P=parts(L).map(solids),Q=P.map(m=>pts(m,3));
    for(let a=0;a<6;a++)for(let b=0;b<6;b++){if(a===b)continue;if(Math.abs(a-b)===1&&(a>b))continue; // neighbours: test once
      let mx=0,n=0;for(const p of Q[a]){const d=inside(p,P[b]);if(d>0){n++;mx=Math.max(mx,d);}}
      if(n>2){const k=names[a]+' in '+names[b];res[k]=Math.max(res[k]||0,mx);}}}
  const e=Object.entries(res).sort((x,y)=>y[1]-x[1]);console.log(tag,e.length?e.map(([k,v])=>k+' '+v.toFixed(1)).join('; '):'clear');}
(async()=>{S.setT(0);S.reset();run(240);
 report('stand, leg 3 (rear left walking)',[3]);report('stand, leg 1',[1]);report('stand, arm 0',[0]);
})();
