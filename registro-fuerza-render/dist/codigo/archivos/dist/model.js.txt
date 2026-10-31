export const CATALOG = [
  {id:'curl',name:'Curl de bíceps',equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de UNA mancuerna. Dos mancuernas de 12 kg se registran como 12 kg, no 24.',tag:'POR UNIDAD'},
  {id:'press',name:'Press de banca',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Barra de 20 kg + 10 kg por lado = 40 kg.',tag:'TOTAL CON BARRA'},
  {id:'remo',name:'Remo sentado',equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina. Compara solo con el mismo equipo; las máquinas pueden diferir.',tag:'MISMO EQUIPO'},
  {id:'sentadilla',name:'Sentadilla',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Barra de 20 kg + 20 kg por lado = 60 kg.',tag:'TOTAL CON BARRA'},
  {id:'rumano',name:'Peso muerto rumano',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Baja con la espalda recta hasta sentir los isquiotibiales.',tag:'TOTAL CON BARRA'},
  {id:'gemelos',name:'Elevación de talones',equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina. Si la haces con mancuernas, anota el peso de una sola.',tag:'MISMO EQUIPO'},
  {id:'crunch',name:'Crunch en polea',equipment:'Polea',unit:'kg indicados en la polea',help:'Copia el valor de la pila de pesas. Compara solo con la misma polea.',tag:'MISMO EQUIPO'}
];
export const STORAGE_KEY='g14-fuerza-v1';
export const exercise=id=>CATALOG.find(e=>e.id===id);
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function daysSince(date,now=new Date()){return Math.max(0,Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.parse(date+'T00:00:00Z'))/86400000));}
export function seed(now=new Date()){
 const ago=n=>{let d=new Date(now);d.setDate(d.getDate()-n);return localDate(d);};
 const legs=[[24,60,50,40,20],[17,65,55,null,22.5],[10,62.5,60,null,null]].map(([n,squat,rdl,calf,crunch])=>({id:'demo-'+n,date:ago(n),note:'Sesión de ejemplo · pierna y core',tag:'Sin etiqueta',reviewed:false,sets:[{id:'s'+n+'a',exercise:'sentadilla',weight:squat,reps:8},{id:'s'+n+'b',exercise:'rumano',weight:rdl,reps:10},calf&&{id:'s'+n+'c',exercise:'gemelos',weight:calf,reps:15},crunch&&{id:'s'+n+'d',exercise:'crunch',weight:crunch,reps:15}].filter(Boolean)}));
 return {version:1,sessions:[...legs,...[28,21,14].map((n,i)=>({id:'demo-'+n,date:ago(n),note:'Sesión de ejemplo',tag:'Sin etiqueta',reviewed:false,sets:[{id:'s'+n+'a',exercise:'curl',weight:10+i,reps:10},{id:'s'+n+'b',exercise:'press',weight:40+i*5,reps:8},{id:'s'+n+'c',exercise:'remo',weight:30+i*5,reps:10}]}))],draft:null};
}
export function validSet(s){return Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0&&Number(s.reps)<=100;}
export function ordered(sessions){return [...sessions].reverse().sort((a,b)=>b.date.localeCompare(a.date));}
export function lastSet(sessions,id){for(const session of ordered(sessions)){const rows=session.sets.filter(s=>s.exercise===id);if(rows.length)return {...rows[rows.length-1],date:session.date};}return null;}
export function series(sessions,id){return ordered(sessions).reverse().filter(s=>s.sets.some(x=>x.exercise===id)).map(s=>({date:s.date,weight:Math.max(...s.sets.filter(x=>x.exercise===id).map(x=>Number(x.weight)))}));}
export function updateSet(state,sessionId,setId,values){if(!validSet(values))throw new Error('Revisa los datos');return {...state,sessions:state.sessions.map(s=>s.id!==sessionId?s:{...s,sets:s.sets.map(x=>x.id!==setId?x:{...x,weight:Number(values.weight),reps:Number(values.reps)})})};}
export const MUSCLES=[
  {id:'pecho',name:'Pecho',side:'front'},{id:'hombros',name:'Hombros',side:'both'},{id:'biceps',name:'Bíceps',side:'front'},{id:'antebrazos',name:'Antebrazos',side:'both'},{id:'abdomen',name:'Abdomen',side:'front'},{id:'cuadriceps',name:'Cuádriceps',side:'front'},
  {id:'trapecio',name:'Trapecio',side:'back'},{id:'triceps',name:'Tríceps',side:'back'},{id:'espalda',name:'Espalda alta',side:'back'},{id:'lumbar',name:'Zona lumbar',side:'back'},{id:'gluteos',name:'Glúteos',side:'back'},{id:'isquios',name:'Isquiotibiales',side:'back'},{id:'gemelos',name:'Gemelos',side:'both'}
];
// Participación de cada músculo en los ejercicios del catálogo (1 = principal).
export const WORKS={curl:{biceps:1,antebrazos:.5},press:{pecho:1,triceps:.6,hombros:.6},remo:{espalda:1,biceps:.5,trapecio:.5,hombros:.3},sentadilla:{cuadriceps:1,gluteos:.6,lumbar:.3},rumano:{isquios:1,gluteos:.6,lumbar:.5,antebrazos:.3},gemelos:{gemelos:1},crunch:{abdomen:1}};
export const WINDOW_DAYS=28;
export const LEVELS=['Sin registros','Baja','Media','Alta'];
export const exercisesFor=muscle=>Object.keys(WORKS).filter(id=>WORKS[id][muscle]);
// Intensidad = carga de la última serie respecto de tu mayor carga en ese ejercicio,
// atenuada según los días transcurridos desde esa serie (0 al cumplir WINDOW_DAYS).
export function muscleLoad(sessions,muscle,now=new Date()){
 let best=null;
 for(const id of exercisesFor(muscle)){
  const last=lastSet(sessions,id);if(!last)continue;
  const days=daysSince(last.date,now);if(days>=WINDOW_DAYS)continue;
  const peak=Math.max(...sessions.flatMap(s=>s.sets).filter(x=>x.exercise===id).map(x=>Number(x.weight)));
  const relative=Number(last.weight)/peak,recency=1-days/WINDOW_DAYS,score=relative*recency*WORKS[id][muscle];
  if(!best||score>best.score)best={exercise:id,weight:Number(last.weight),reps:last.reps,date:last.date,days,relative,recency,share:WORKS[id][muscle],score};
 }
 if(!best)return {level:0,score:0,source:null};
 return {level:best.score<1/3?1:best.score<2/3?2:3,score:best.score,source:best};
}
export function recentWork(sessions,muscle,limit=5){const ids=exercisesFor(muscle);return ordered(sessions).map(s=>({id:s.id,date:s.date,sets:s.sets.filter(x=>ids.includes(x.exercise))})).filter(s=>s.sets.length).slice(0,limit);}
