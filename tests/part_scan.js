// Shell clearance: no leg, servo cover or claw may enter the shell volume while the crab walks, turns, jumps, crouches, pitches or picks. Run: node shell_clear_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {setT:v=>{Tamp=v;terrDirty=true;},mInk,mHit,ang,c,legs,NL,DEP,ANG,ARM,SHS:typeof SHS==="undefined"?1:SHS,LIFT:typeof LIFT==="undefined"?0:LIFT,skRho,SKZ,body,AUTO,c,Q,reset,runCommand,flipTest,pos,keys:typeof K!=="undefined"?K:null};')(...Object.values(g));
const run=n=>{for(let k=0;k<n;k++){frames++;cb();}};
const M=Math,v=new THREE.Vector3();
// depth (mm) by which a sphere of radius r at body-frame point p sticks into the shell (0 if clear)
function pen(p,r){const yy=p.y-S.LIFT;let d=0;p=p.clone();p.x/=S.SHS;p.z/=S.SHS;r=r/S.SHS;
  if(yy>=-19&&yy<=28){const rho=S.skRho(yy)+r,e=M.hypot(p.x/rho,p.z/(rho*S.SKZ));if(e<1)d=M.max(d,(1-e)*rho);}
  else if(yy>28){const e=M.hypot(p.x/(118+r),(yy-12)/(50+r),p.z/(128+r));if(e<1&&yy<62+r)d=M.max(d,(1-e)*50);}
  return d;}
// sample points along each part of each leg (link meshes carry position + quaternion; length along local y)
const worst={};function sample(tag){const inv=new THREE.Matrix4().copy(S.body.matrixWorld).invert();S.body.updateMatrixWorld(true);
  for(let i=0;i<S.NL;i++){const L=S.legs[i];
    const parts=[[L.lk[0],S.legs[i].len0||0,14],[L.lk[1],0,15],[L.lk[2],0,13],[L.sv[1],0,17],[L.sv[2],0,17]];
    L.lk.forEach((o,n)=>{o.updateWorldMatrix(true,false);const len=[55,80,n===2?(S.ARM(i)?65:130):0][n];for(let s=0;s<=6;s++){v.set(0,len*s/6,0).applyMatrix4(o.matrixWorld).applyMatrix4(inv);const d=pen(v,[16,18,14][n]);if(d>0){const k=tag+' L'+i+(S.ARM(i)?' arm':' leg')+' link'+n;worst[k]=M.max(worst[k]||0,d);}}});
    L.sv.forEach((o,n)=>{if(!n)return;o.updateWorldMatrix(true,false);v.set(0,0,0).applyMatrix4(o.matrixWorld).applyMatrix4(inv);const d=pen(v,24);if(d>0){const k=tag+' L'+i+(S.ARM(i)?' arm':' leg')+' servo'+n;worst[k]=M.max(worst[k]||0,d);}});
    if(L.cl){L.cl.updateWorldMatrix(true,false);[[10,20,0],[10,50,0],[0,30,12]].forEach(q=>{v.set(...q).applyMatrix4(L.cl.matrixWorld).applyMatrix4(inv);const d=pen(v,22);if(d>0){const k=tag+' claw';worst[k]=M.max(worst[k]||0,d);}});}}}
async function scen(tag,cmd,maxF){S.reset();run(3);const p=cmd?S.runCommand(cmd):Promise.resolve();await p;let f=0;while(((S.AUTO.on)||f<120)&&f<maxF){run(1);if(f%4===0)sample(tag);f++;}}


const RC=new THREE.Raycaster();
function parts(i){const L=S.legs[i],out=[];
 const add=(grp,tag)=>grp.traverse(o=>{if(o.isMesh&&o.material!==S.mInk&&o.geometry&&o.geometry.type!=='SphereGeometry'||(o.isMesh&&o.geometry&&o.geometry.type==='SphereGeometry'&&o.material!==S.mInk))out.push({o,tag});});
 L.sv.forEach((g,n)=>add(g,'servo'+n));L.lk.forEach((g,n)=>add(g,'link'+n));
 out.forEach((p,k)=>{p.id=k;p.name=p.tag+':'+p.o.geometry.type.replace('Geometry','')+(p.o.geometry.parameters&&p.o.geometry.parameters.width?'['+['width','height','depth'].map(a=>(p.o.geometry.parameters[a]||0).toFixed(0)).join('x')+']':'')+'#'+k;});return out;}
function inside(P,pt){ // parity ray test against mesh P
 const o=P.o;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const inv=new THREE.Matrix4().copy(o.matrixWorld).invert(),l=pt.clone().applyMatrix4(inv);if(!o.geometry.boundingBox.containsPoint(l))return false;
 let c=0;for(const d of [[1,0,0],[0,1,0.0001]]){RC.set(l,new THREE.Vector3(...d).normalize());const m=o.material;const side=m.side;m.side=THREE.DoubleSide;RC.far=1e4;const prev=o.matrixWorld;const h=RC.intersectObject(Object.assign(new THREE.Mesh(o.geometry,m)),false);m.side=side;c+=h.length%2;}return c===2;}
let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function overlapVol(A,B,N){A.o.updateWorldMatrix(true,false);B.o.updateWorldMatrix(true,false);const ba=new THREE.Box3().setFromObject(A.o),bb=new THREE.Box3().setFromObject(B.o);if(!ba.intersectsBox(bb))return 0;
 const bx=ba.clone().intersect(bb),sz=bx.getSize(new THREE.Vector3()),vol=sz.x*sz.y*sz.z;let hit=0;
 for(let k=0;k<N;k++){const p=new THREE.Vector3(bx.min.x+rnd()*sz.x,bx.min.y+rnd()*sz.y,bx.min.z+rnd()*sz.z);if(inside(A,p)&&inside(B,p))hit++;}
 return vol*hit/N;}

const agg={};
function scan(tag){S.body.updateMatrixWorld(true);for(let i=0;i<S.NL;i++){S.legs[i].lk.forEach(o=>o.updateMatrixWorld(true));S.legs[i].sv.forEach(o=>o.updateMatrixWorld(true));
 const P=parts(i);for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){if(P[a].o.parent===P[b].o.parent&&P[a].tag===P[b].tag)continue;if(/Sphere/.test(P[a].name+P[b].name))continue;
  const v=overlapVol(P[a],P[b],300);if(v>25){const key=(S.ARM(i)?'arm ':'leg ')+P[a].name.replace(/#\d+/,'')+' x '+P[b].name.replace(/#\d+/,'');const r=agg[key]||(agg[key]={max:0,tags:{},n:0});r.n++;if(v>r.max){r.max=v;r.at=tag+' L'+i+' ang '+S.ang[i].map(x=>(x*180/Math.PI).toFixed(0)).join(',');}r.tags[tag]=1;}}}}
async function seq(tag,setup,cmd){S.setT(0);S.reset();run(3);setup&&setup();run(100);if(cmd){await S.runCommand(cmd);let f=0;while(S.AUTO.on&&f<900){run(1);if(f%30===0)scan(tag);f++;}}else{for(let f=0;f<4;f++){run(30);scan(tag);}}}
(async()=>{
 await seq('stand');
 await seq('pitch+20',()=>S.c.pitch=20);await seq('pitch-20',()=>S.c.pitch=-20);
 await seq('roll+8',()=>S.c.roll=8);await seq('roll-8',()=>S.c.roll=-8);
 await seq('yaw+25',()=>S.c.yaw=25);await seq('yaw-25',()=>S.c.yaw=-25);
 await seq('crouch',()=>S.c.crouch=true);
 await seq('walk',null,'move 30 centimeters forward');await seq('turn',null,'turn left 90 degrees');
 await seq('ramp',null,'go to the top of the ramp');
 S.setT(60);await seq('rough walk',null,'move 30 centimeters forward');
 Object.entries(agg).sort((a,b)=>b[1].max-a[1].max).slice(0,16).forEach(([k,r])=>console.log(r.max.toFixed(0).padStart(6),'mm3 n='+r.n,k,'| worst at',r.at,'| poses',Object.keys(r.tags).join(',')));
})();
