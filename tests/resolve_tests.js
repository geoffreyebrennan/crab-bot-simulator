// Name-matching tests for the Virtual Hexapod page (Phase 2, sub-step 2.2). Run: node resolve_tests.js [--html path]
module.paths.push('/tmp/node_modules');const fs=require('fs');
const i=process.argv.indexOf('--html'),HTML=i<0?'/mnt/user-data/outputs/hexapod.html':process.argv[i+1];
const THREE=require('three');let code=fs.readFileSync(HTML,'utf8').split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='classList'?{toggle(){}}:k==='dataset'?{}:k==='value'?'#000000':(()=>el()),set:()=>true,apply:()=>el()});
THREE.WebGLRenderer=function(){return{setSize(){},render(){},setViewport(){},setScissor(){},setScissorTest(){}}};
const doc={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:{removeAttribute(){},dataset:{}},addEventListener(){},activeElement:null};
let frames=0,cb;global.requestAnimationFrame=f=>{cb=f};global.matchMedia=()=>({matches:true,addEventListener(){}});
const g={THREE,document:doc,addEventListener(){},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>'#000'}),focus(){},JSZip:null,performance:{now:()=>frames*16.67}};
const S=new Function(...Object.keys(g),code+';return {resolve,resolveStrict,ents,pos,reset,localParse,normPlan,get notes(){return RES_NOTES},clear:()=>{RES_NOTES=[];}};')(...Object.values(g));
for(let k=0;k<30;k++){frames++;cb();}
let pass=0,fail=0;const bad=[];
const T=(txt,want,opt)=>{S.clear();const e=S.resolve(txt,opt||{});const got=e?e.name:null;if(got===want)pass++;else{fail++;bad.push(`${JSON.stringify(txt)} -> ${got}  (wanted ${want})`);}};
const names=['red cube','teal ball','yellow cube','blue ball','green cube','pink ball','red pillar','teal block','yellow pillar','blue block','orange pillar','green block','purple pillar','sky blue block'];
names.forEach(n=>{T(n,n);T('go to the '+n,n);T('pick up the '+n+' with your left claw',n);T('face the '+n+' please',n);T('walk to a '+n+' over there',n);});
// synonyms and colour wording
[['pink sphere','pink ball'],['magenta ball','pink ball'],['purple ball','pink ball'],['violet ball','pink ball'],['lilac ball','pink ball'],['purple pillar','purple pillar'],['violet pillar','purple pillar'],['lavender pillar','purple pillar'],['mauve column','purple pillar'],
 ['sky blue block','sky blue block'],['light blue block','sky blue block'],['pale blue block','sky blue block'],['sky block','sky blue block'],['blue block','blue block'],['navy block','blue block'],['indigo ball','blue ball'],
 ['coral cube','red cube'],['crimson cube','red cube'],['rose pillar','red pillar'],['scarlet pillar','red pillar'],['gold cube','yellow cube'],['golden pillar','yellow pillar'],
 ['turquoise ball','teal ball'],['aqua ball','teal ball'],['cyan block','teal block'],['orange column','orange pillar'],['green box','green cube'],['green slab','green block'],['teal dice',null]].forEach(([a,b])=>T('go to the '+a,b));
// fillers, plurals, punctuation
[['go to the small pink ball over there','pink ball'],['go to the pink ball please','pink ball'],['go to that pink ball','pink ball'],['go to the big orange pillar','orange pillar'],['pick up the little blue ball','blue ball'],['walk to the yellow cubes','yellow cube'],['go to the pink ball!','pink ball'],['  GO TO THE PINK BALL  ','pink ball'],['go to the pink-ball','pink ball']].forEach(([a,b])=>T(a,b));
// unknown things must not match something similar
['go to the purple dragon','go to the elephant','go to the tree','go to the blue frisbee','go to the pink cat','go to the scared ball','go to the covered cube','go to the greenhouse','go to the orangutan','go to the red button','pick up the green banana'].forEach(a=>T(a,null));
// only one word that is not an object: no match at all
['jump','turn left','move 12 cm forward','go home','what is that'].forEach(a=>T(a,null));
// nearest / farthest / ambiguous colour-only
const at=(x,z)=>{S.pos.x=x/1000;S.pos.z=z/1000;};
at(0,0);T('go to the nearest ball','pink ball');T('the closest cube','green cube');T('go to the farthest pillar','purple pillar');T('go to the nearest pillar','red pillar');
at(1250,-350);T('go to the nearest pillar','red pillar');T('go to the nearest block','teal block');T('go to the farthest pillar','orange pillar');
at(-650,-250);T('go to the nearest block','sky blue block');T('go to the green one','green cube',{small:true});
at(0,0);T('go to the green one','green cube');T('go to the blue one','blue ball');T('pick up the green one','green cube',{small:true});T('go to the orange one','orange pillar');
// notes: ambiguity is reported unless the user asked for nearest/farthest
S.clear();S.resolve('go to the ball',{note:true});const n1=S.notes.length;S.clear();S.resolve('go to the nearest ball',{note:true});const n2=S.notes.length;S.clear();S.resolve('go to the pink ball',{note:true});const n3=S.notes.length;
const chk=(c,m)=>{if(c)pass++;else{fail++;bad.push(m);}};
chk(n1===1,'ambiguous "the ball" should leave one note, got '+n1);chk(n2===0,'"the nearest ball" should leave no note, got '+n2);chk(n3===0,'"the pink ball" should leave no note, got '+n3);
// through the whole parser: the right object ends up in the plan
const plan=t=>S.normPlan(S.localParse(t));
const tgt=(t)=>{const p=plan(t);return p.length&&p[0].target;};
at(0,0);
chk(tgt('go to the sky blue block')==='sky blue block','parser: sky blue block -> '+tgt('go to the sky blue block'));
chk(tgt('go to the purple dragon')===0||tgt('go to the purple dragon')===undefined||!plan('go to the purple dragon').length,'parser: purple dragon should give no plan');
chk(plan('pick up the nearest ball with your right claw')[0].target==='pink ball','parser: nearest ball');
chk(plan('go to the light blue block and pick up the pink ball')[0].target==='sky blue block','parser: chained names');
console.log('name matching:',pass,'passed,',fail,'failed');bad.forEach(b=>console.log('  FAIL',b));process.exit(fail?1:0);
