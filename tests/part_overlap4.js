// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {setT:v=>{Tamp=v;terrDirty=true;},scene,mInk,c,legs,NL,DEP,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const M=Math,v=new THREE.Vector3();

const RC=new THREE.Raycaster();const D6=[new V(1,0,0),new V(0,1,0),new V(0,0,1)];function V(x,y,z){return new THREE.Vector3(x,y,z);}
function parts(root,skip){const out=[];root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||(globalThis.NOSPH&&o.geometry.type==='SphereGeometry')||o.material===S.mInk||o.material.side===THREE.BackSide||skip&&skip(o))return;
 if(o.geometry.attributes.position.count>20000)return;o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);out.push({o,bb});});return out;}
const mats=new Map();
function inside(p,B){if(!B.bb.containsPoint(p))return false;const m=B.o.material;if(!mats.has(m)){mats.set(m,m.clone());mats.get(m).side=THREE.DoubleSide;}const old=B.o.material;B.o.material=mats.get(old);
 let hits=0;for(const d of [new V(1,.13,.07).normalize(),new V(-.11,1,.17).normalize()]){RC.set(p,d);RC.far=400;hits+=RC.intersectObject(B.o,false).length%2;}B.o.material=old;return hits===2;}
function pairs(legIdx,others){S.scene.updateMatrixWorld(true);const res={};
 const L=S.legs[legIdx];const G={};['sv','lk'].forEach(k=>L[k].forEach((o,n)=>{G[k+n]=parts(o);}));
 const legObjs=new Set();S.legs.forEach(l=>{l.sv.forEach(o=>legObjs.add(o));l.lk.forEach(o=>legObjs.add(o));});
 const bodyParts=[];S.body.children.forEach(ch=>{if(legObjs.has(ch))return;bodyParts.push(...parts(ch));});
 const T={body:bodyParts};others.forEach(j=>{['sv','lk'].forEach(k=>S.legs[j][k].forEach((o,n)=>{T['L'+j+k+n]=parts(o);}));});
 const dsc=o=>{o.geometry.computeBoundingBox();const z=o.geometry.boundingBox.getSize(new V(0,0,0));return o.geometry.type.replace('Geometry','')+'['+z.x.toFixed(0)+'x'+z.y.toFixed(0)+'x'+z.z.toFixed(0)+']';};
 for(const A of Object.keys(G))for(const B of Object.keys(T)){let n=0,ex=null,lab=null;
  for(const pa of G[A]){const pos=pa.o.geometry.attributes.position,idx=pa.o.geometry.index,mw=pa.o.matrixWorld,gv=k=>new V(pos.getX(k),pos.getY(k),pos.getZ(k));const nT=idx?idx.count/3:pos.count/3;
   for(let t=0;t<nT;t++){const i0=idx?idx.getX(t*3):t*3,i1=idx?idx.getX(t*3+1):t*3+1,i2=idx?idx.getX(t*3+2):t*3+2;const a=gv(i0),b=gv(i1),c=gv(i2);
    for(const p0 of [a,a.clone().add(b).add(c).multiplyScalar(1/3),b.clone().add(c).multiplyScalar(.5)]){const p=p0.clone().applyMatrix4(mw);for(const pb of T[B]){if(inside(p,pb)){n++;if(!ex){ex=p.clone();lab=A+':'+dsc(pa.o)+' in '+B+':'+dsc(pb.o);}break;}}}}}
  if(n)res[A+' in '+B]=[n,ex,lab];}
 return res;}
async function main(){
 S.Q.col=true;const neigh={};for(let k=0;k<8;k++)neigh[k]=[(k+1)%8,(k+7)%8];
 const cmds=process.argv[2]?[process.argv[2]]:['move 40 centimeters forward','turn left 90 degrees','move 30 centimeters right','jump'];
 for(const amp of [0]){S.setT(amp);for(const cmd of cmds){S.reset();run(60);await S.runCommand(cmd);let f=0;const agg={};
  while(S.AUTO.on&&f<14*60){run(1);f++;if(f%20===0){for(let i=0;i<8;i++){const res=pairs(i,neigh[i]);for(const [k,[n,p,l]] of Object.entries(res)){if(n<10)continue;if(/ in L\d+(sv|lk)\d/.test(k)||/ in body/.test(k)){const key='L'+i+' '+l;if(!agg[key]||agg[key]<n)agg[key]=n;}}}}}
  console.log(cmd,'amp',amp,Object.keys(agg).length?Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,n])=>k+' n='+n).join(' | '):'clean');}}
}
main();
