// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {scene,mInk,c,legs,NL,DEP,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const M=Math,v=new THREE.Vector3();

const RC=new THREE.Raycaster();const D6=[new V(1,0,0),new V(0,1,0),new V(0,0,1)];function V(x,y,z){return new THREE.Vector3(x,y,z);}
function parts(root,skip){const out=[];root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||(globalThis.NOSPH&&o.geometry.type==='SphereGeometry')||o.material===S.mInk||o.material.side===THREE.BackSide||skip&&skip(o))return;
 if(o.geometry.attributes.position.count>20000)return;o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);out.push({o,bb});});return out;}
const mats=new Map();
function inside(p,B){if(!B.bb.containsPoint(p))return false;const m=B.o.material;if(!mats.has(m)){mats.set(m,m.clone());mats.get(m).side=THREE.DoubleSide;}const old=B.o.material;B.o.material=mats.get(old);
 let hits=0;for(const d of [new V(1,.13,.07).normalize(),new V(-.11,1,.17).normalize()]){RC.set(p,d);RC.far=400;hits+=RC.intersectObject(B.o,false).length%2;}B.o.material=old;return hits===2;}
function pairs(tag,legIdx){const sc=S.scene;sc.updateMatrixWorld(true);const res={};
 const G={};const L=S.legs[legIdx];['sv','lk'].forEach(k=>L[k].forEach((o,n)=>{G[k+n]=parts(o);}));
 const names=Object.keys(G);
 // body parts: everything attached to the body that is not a leg part
 const legObjs=new Set();S.legs.forEach(l=>{l.sv.forEach(o=>legObjs.add(o));l.lk.forEach(o=>legObjs.add(o));});
 const bodyParts=[];S.body.children.forEach(ch=>{if(legObjs.has(ch))return;bodyParts.push(...parts(ch));});
 G.body=bodyParts;if(!globalThis.__bp){globalThis.__bp=1;console.log('body parts',bodyParts.map(p=>p.o.geometry.type+':'+p.o.geometry.attributes.position.count).join(' '));S.body.children.forEach(ch=>{if(!legObjs.has(ch)){let n=0;ch.traverse(o=>{if(o.isMesh)n++;});console.log('child',ch.type,ch.children.length,'meshes',n);}});}
 for(let a=0;a<names.length+1;a++)for(let b=0;b<names.length+1;b++){const A=a<names.length?names[a]:'body',B=b<names.length?names[b]:'body';if(A===B||(A==='body'))continue; if(A===B)continue;
  if(!(A!=='body'))continue;let n=0,ex=null;
  for(const pa of G[A]){const pos=pa.o.geometry.attributes.position,idx=pa.o.geometry.index,mw=pa.o.matrixWorld;const seen=new Set();const pts=[];const gv=k=>new V(pos.getX(k),pos.getY(k),pos.getZ(k));const nT=idx?idx.count/3:pos.count/3;for(let t=0;t<nT;t++){const i0=idx?idx.getX(t*3):t*3,i1=idx?idx.getX(t*3+1):t*3+1,i2=idx?idx.getX(t*3+2):t*3+2;const a=gv(i0),b=gv(i1),c=gv(i2);pts.push(a,b.clone().add(c).multiplyScalar(.5),a.clone().add(b).multiplyScalar(.5),a.clone().add(b).add(c).multiplyScalar(1/3));}
  for(const p0 of pts){const key=p0.x.toFixed(1)+','+p0.y.toFixed(1)+','+p0.z.toFixed(1);if(seen.has(key))continue;seen.add(key);const p=p0.clone().applyMatrix4(mw);
    for(const pb of G[B]){if(pb.o===pa.o)continue;if(inside(p,pb)){n++;if(!ex)ex=p.clone();const dsc=o=>{o.geometry.computeBoundingBox();const z=o.geometry.boundingBox.getSize(new V(0,0,0));const w=new V(0,0,0);o.getWorldPosition(w);return o.geometry.type.replace('Geometry','')+'['+z.x.toFixed(0)+'x'+z.y.toFixed(0)+'x'+z.z.toFixed(0)+']';};const lab=tag+' L'+legIdx+' '+A+':'+dsc(pa.o)+' in '+B+':'+dsc(pb.o);globalThis.__lab=globalThis.__lab||{};globalThis.__lab[lab]=(globalThis.__lab[lab]||0)+1;globalThis.__ex=globalThis.__ex||{};globalThis.__ex[lab]=globalThis.__ex[lab]||p.clone().toArray().map(v=>+v.toFixed(0));break;}}}}
  if(n){const key=A+' in '+B;res[key]=[n,ex];}}
 return res;}
module.exports={};
async function main(){
 S.setT=S.setT||(()=>{});
 S.reset();run(200);globalThis.NOSPH=true;
 for(const i of [0,1,3,4,7]){const r=pairs('stand',i);console.log('leg',i,Object.keys(r).length?Object.entries(r).map(([k,[n,p]])=>k+' '+n+' @'+[p.x,p.y,p.z].map(v=>v.toFixed(0))).join(' | '):'no penetrating vertices');}
}
main().then(()=>{for(const k in globalThis.__lab)if(/ L3 /.test(k))console.log(k,globalThis.__lab[k],globalThis.__ex[k]);});
