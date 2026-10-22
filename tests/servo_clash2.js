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

function gname(m){const g=m.geometry,t=g.type.replace('Geometry',''),p=g.parameters||{};g.computeBoundingBox();const b=g.boundingBox,d=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z].map(v=>v.toFixed(0)).join('x');return t+'['+d+']';}
function meshesOf(grp){const o=[];grp.updateWorldMatrix(true,true);grp.traverse(m=>{if(m.isMesh&&m.material!==S.mInk&&!(m.parent&&m.parent.isMesh&&m.material===S.mInk)&&m.geometry&&m.geometry.attributes.position&&m.geometry.type!=='SphereGeometry'){m.updateWorldMatrix(true,false);o.push(m);}});return o;}
const rc=new THREE.Raycaster();
function insideOne(p,mesh){let votes=0,best=1e9;for(const d of [[1,0,0],[0,1,0],[0,0,1]]){let cnt=0,ex=1e9;for(const sg of [1,-1]){rc.set(p,new THREE.Vector3(...d).multiplyScalar(sg));rc.near=0;rc.far=200;const h=rc.intersectObject(mesh,false).filter(x=>x.distance>1e-4);if(sg===1)cnt=h.length;if(h.length)ex=Math.min(ex,h[0].distance);}if(cnt%2===1)votes++;best=Math.min(best,ex);}return votes>=2?best:0;}
function pts(m,step){const a=m.geometry.attributes.position,o=[];for(let k=0;k<a.count;k+=step)o.push(new THREE.Vector3().fromBufferAttribute(a,k).applyMatrix4(m.matrixWorld));return o;}
const lab=['hipServo','coxa','femServo','femur','tibServo','tibia'];
function report(tag,i,thr){S.body.updateMatrixWorld(true);const L=S.legs[i],grps=[L.sv[0],L.lk[0],L.sv[1],L.lk[1],L.sv[2],L.lk[2]],ms=grps.map((g,k)=>meshesOf(g).map(m=>({m,k,n:lab[k]+':'+gname(m)})));
  const out={};
  for(let a=0;a<6;a++)for(let b=0;b<6;b++){if(Math.abs(a-b)>2||a===b)continue;
    for(const A of ms[a])for(const B of ms[b]){if(A.m===B.m)continue;let mx=0,n=0;for(const p of pts(A.m,2)){const d=insideOne(p,B.m);if(d>0){n++;mx=Math.max(mx,d);}}if(n>2&&mx>thr){const k=A.n+' in '+B.n;out[k]=Math.max(out[k]||0,mx);}}}
  const e=Object.entries(out).sort((x,y)=>y[1]-x[1]);console.log('== '+tag);e.forEach(([k,v])=>console.log('  '+v.toFixed(1).padStart(5)+'  '+k));}
(async()=>{S.setT(0);S.reset();run(240);report('leg 3 stand',3,.8);report('arm 0 stand',0,.8);})();
