// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {setT:v=>{Tamp=v;terrDirty=true;},c,legs,NL,DEP,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const M=Math;
const ray=new THREE.Raycaster();
function inside(pt,mesh){ // ray parity test against a closed mesh
  const bb=mesh.userData.bb||(mesh.userData.bb=new THREE.Box3().setFromObject(mesh));if(!bb.containsPoint(pt))return false;
  let n=0;for(const dir of [new THREE.Vector3(.577,.577,.577),new THREE.Vector3(-.3,.9,.2).normalize()]){ray.set(pt,dir);ray.far=1e4;const h=ray.intersectObject(mesh,false);n+=h.length%2;}return n===2;}
function verts(mesh,step){const a=mesh.geometry.attributes.position,out=[];for(let k=0;k<a.count;k+=step){out.push(new THREE.Vector3().fromBufferAttribute(a,k).applyMatrix4(mesh.matrixWorld));}return out;}
const names=['sv0','lk0','sv1','lk1','sv2','lk2'];
function groups(i){const L=S.legs[i];return {sv0:L.sv[0],lk0:L.lk[0],sv1:L.sv[1],lk1:L.lk[1],sv2:L.sv[2],lk2:L.lk[2]};}
function meshesOf(o){const r=[];o.traverse(m=>{if(m.isMesh&&m.material&&m.material.side!==THREE.BackSide&&!(m.parent&&m.parent.isMesh&&m.geometry===m.parent.geometry))r.push(m);});return r;}
function check(i,label){S.body.updateMatrixWorld(true);const G=groups(i),res={};
  const leg=new Set();S.legs.forEach(L=>{L.sv.concat(L.lk).forEach(o=>leg.add(o));});
  const fixed=[];S.body.traverse(m=>{if(!m.isMesh)return;let p=m,isLeg=false;while(p){if(leg.has(p)){isLeg=true;break;}p=p.parent;}if(!isLeg&&m.material.side!==THREE.BackSide&&m.geometry.type!=='SphereGeometry')fixed.push(m);});
  const own=[];for(const a of names)for(const b of names){if(a>=b)continue;own.push([a,b]);}
  for(const [a,b] of own){let cnt=0;for(const ma of meshesOf(G[a]))for(const pt of verts(ma,2)){for(const mb of meshesOf(G[b])){if(inside(pt,mb)){cnt++;break;}}}
    for(const mb of meshesOf(G[b]))for(const pt of verts(mb,2)){for(const ma of meshesOf(G[a])){if(inside(pt,ma)){cnt++;break;}}}
    if(cnt)res[a+'~'+b]=cnt;}
  for(const a of names){let cnt=0;for(const ma of meshesOf(G[a]))for(const pt of verts(ma,2))for(const mf of fixed){if(inside(pt,mf)){cnt++;break;}}if(cnt)res[a+'~body']=cnt;}
  console.log(label,'leg',i,JSON.stringify(res));}
(async()=>{S.setT(0);S.reset();run(200);S.body.updateMatrixWorld(true);
 for(const i of [1,2,3]){check(i,'rest');}
 S.setT(0);await S.runCommand('move 30 centimeters forward');let f=0;while(S.AUTO.on&&f<600){run(1);f++;if(f%120===0)check(2,'walking');}
})();
