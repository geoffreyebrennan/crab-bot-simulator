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

function pairDetail(i,a,b,label){S.body.updateMatrixWorld(true);const G=groups(i),piv=new THREE.Vector3().setFromMatrixPosition(G[b].matrixWorld),out=[];
  const inv=new THREE.Matrix4().copy(G[b].matrixWorld).invert();
  for(const ma of meshesOf(G[a]))for(const pt of verts(ma,1)){for(const mb of meshesOf(G[b])){if(inside(pt,mb)){const l=pt.clone().applyMatrix4(inv);out.push(l);break;}}}
  for(const mb of meshesOf(G[b]))for(const pt of verts(mb,1)){for(const ma of meshesOf(G[a])){if(inside(pt,ma)){out.push(pt.clone().applyMatrix4(inv));break;}}}
  const mm=k=>[Math.min(...out.map(p=>p[k])).toFixed(0),Math.max(...out.map(p=>p[k])).toFixed(0)];
  console.log(label,'leg',i,a,'in',b,'n',out.length,'| in the',b,'frame x',mm('x'),'y',mm('y'),'z',mm('z'));}

function fixedHits(i,label){S.body.updateMatrixWorld(true);const G=groups(i),leg=new Set();S.legs.forEach(L=>{L.sv.concat(L.lk).forEach(o=>leg.add(o));});
  const fixed=[];S.body.traverse(m=>{if(!m.isMesh)return;let p=m,isLeg=false;while(p){if(leg.has(p)){isLeg=true;break;}p=p.parent;}if(!isLeg&&m.material.side!==THREE.BackSide&&m.geometry.type!=='SphereGeometry')fixed.push(m);});
  const inv=new THREE.Matrix4().copy(S.body.matrixWorld).invert();const rep={};
  for(const a of names)for(const ma of meshesOf(G[a]))for(const pt of verts(ma,2))for(const mf of fixed){if(inside(pt,mf)){const bb=new THREE.Box3().setFromObject(mf).applyMatrix4(inv);const k=a+' in '+mf.geometry.type+' ['+[bb.min.x,bb.min.y,bb.min.z,bb.max.x,bb.max.y,bb.max.z].map(v=>v.toFixed(0)).join(',')+']';rep[k]=(rep[k]||0)+1;break;}}
  console.log(label,'leg',i);for(const k in rep)console.log('  ',k,rep[k]);}

const AGG={};
function sweepCheck(tag){S.body.updateMatrixWorld(true);const leg=new Set();S.legs.forEach(L=>{L.sv.concat(L.lk).forEach(o=>leg.add(o));});
  const fixed=[];S.body.traverse(m=>{if(!m.isMesh)return;let p=m,isLeg=false;while(p){if(leg.has(p)){isLeg=true;break;}p=p.parent;}if(!isLeg&&m.material.side!==THREE.BackSide&&m.geometry.type!=='SphereGeometry')fixed.push(m);});
  const inv=new THREE.Matrix4().copy(S.body.matrixWorld).invert();
  for(let i=0;i<S.NL;i++){const G=groups(i);
    for(const a of names)for(const ma of meshesOf(G[a]))for(const pt of verts(ma,3)){
      for(const mf of fixed){if(inside(pt,mf)){const bb=new THREE.Box3().setFromObject(mf).applyMatrix4(inv);const k='BODY '+a+' in '+mf.geometry.type+' ['+[bb.min.y,bb.max.y,bb.max.x].map(v=>v.toFixed(0)).join(',')+']';AGG[k]=Math.max(AGG[k]||0,1)+0;AGG[k+' #']=(AGG[k+' #']||0)+1;break;}}
    }
    // leg-vs-neighbour: parts of i inside parts of i+1
    const j=(i+1)%S.NL,H=groups(j);
    for(const a of names)for(const ma of meshesOf(G[a]))for(const pt of verts(ma,3))for(const b of names){let hit=false;for(const mb of meshesOf(H[b]))if(inside(pt,mb)){hit=true;break;}if(hit){const k='NEIGHBOUR '+a+' in '+b;AGG[k+' #']=(AGG[k+' #']||0)+1;break;}}
  }}
async function scen(tag,setup,cmd,frames){S.setT(0);S.reset();run(150);setup&&setup();if(cmd){await S.runCommand(cmd);}let f=0;while(f<frames){run(1);f++;if(f%45===0)sweepCheck(tag);}}
(async()=>{
 await scen('rest',null,null,90);
 await scen('yaw25',()=>{S.c.yaw=25;},null,180);
 await scen('roll8',()=>{S.c.roll=8;},null,180);
 await scen('roll-8',()=>{S.c.roll=-8;},null,180);
 await scen('walk',null,'move 30 centimeters forward',300);
 await scen('strafe',null,'move 20 centimeters right',240);
 await scen('turn',null,'turn left 90 degrees',240);
 await scen('crouch',()=>{S.c.crouch=true;},null,180);
 for(const k of Object.keys(AGG).filter(k=>/#$/.test(k)).sort())console.log(k,AGG[k]);
})();
