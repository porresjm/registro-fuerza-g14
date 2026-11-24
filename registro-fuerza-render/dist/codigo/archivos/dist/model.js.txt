export const CATALOG = [
  {id:'curl',name:'Curl de bíceps',equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de UNA mancuerna. Dos mancuernas de 12 kg se registran como 12 kg, no 24.',tag:'POR UNIDAD'},
  {id:'press',name:'Press de banca',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Barra de 20 kg + 10 kg por lado = 40 kg.',tag:'TOTAL CON BARRA'},
  {id:'remo',name:'Remo sentado',equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina. Compara solo con el mismo equipo; las máquinas pueden diferir.',tag:'MISMO EQUIPO'},
  {id:'sentadilla',name:'Sentadilla',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Barra de 20 kg + 20 kg por lado = 60 kg.',tag:'TOTAL CON BARRA'},
  {id:'rumano',name:'Peso muerto rumano',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Baja con la espalda recta hasta sentir los isquiotibiales.',tag:'TOTAL CON BARRA'},
  {id:'gemelos',name:'Elevación de talones',equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina. Si la haces con mancuernas, anota el peso de una sola.',tag:'MISMO EQUIPO'},
  {id:'crunch',name:'Crunch en polea',equipment:'Polea',unit:'kg indicados en la polea',help:'Copia el valor de la pila de pesas. Compara solo con la misma polea.',tag:'MISMO EQUIPO'},
  {id:'jalon',name:'Jalón al pecho',equipment:'Polea',unit:'kg indicados en la polea',help:'Copia el valor de la pila de pesas y compara con la misma polea.',tag:'MISMO EQUIPO'},
  {id:'triceps',name:'Extensión de tríceps',equipment:'Polea',unit:'kg indicados en la polea',help:'Copia el valor de la pila de pesas y compara con la misma polea.',tag:'MISMO EQUIPO'},
  {id:'militar',name:'Press militar',equipment:'Barra',unit:'kg totales con barra',help:'Incluye el peso de la barra y todos los discos.',tag:'TOTAL CON BARRA'},
  {id:'lateral',name:'Elevaciones laterales',equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de una sola mancuerna, no la suma del par.',tag:'POR UNIDAD'},
  {id:'martillo',name:'Curl martillo',equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de una sola mancuerna, no la suma del par.',tag:'POR UNIDAD'},
  {id:'prensa',name:'Prensa de piernas',equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina y compara solo con el mismo equipo.',tag:'MISMO EQUIPO'},
  {id:'hipthrust',name:'Hip thrust',equipment:'Barra',unit:'kg totales con barra',help:'Incluye el peso de la barra y todos los discos.',tag:'TOTAL CON BARRA'},
  {id:'zancadas',name:'Zancadas con mancuernas',equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de una sola mancuerna, no la suma del par.',tag:'POR UNIDAD'},
  {id:'bicepspolea',name:'Curl de bíceps en polea',equipment:'Polea',unit:'kg indicados en la polea',help:'Copia el valor de la pila de pesas y compara con la misma polea.',tag:'MISMO EQUIPO'}
];
export const STORAGE_KEY='g14-fuerza-v1';
export const exercise=(id,catalog=CATALOG)=>catalog.find(e=>e.id===id);
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function daysSince(date,now=new Date()){return Math.max(0,Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.parse(date+'T00:00:00Z'))/86400000));}
export function seed(now=new Date()){
 const ago=n=>{let d=new Date(now);d.setDate(d.getDate()-n);return localDate(d);};
 const legs=[[24,60,50,40,20],[17,65,55,null,22.5],[10,62.5,60,null,null]].map(([n,squat,rdl,calf,crunch])=>({id:'demo-'+n,date:ago(n),note:'Sesión de ejemplo · pierna y core',tag:'Sin etiqueta',reviewed:false,sets:[{id:'s'+n+'a',exercise:'sentadilla',weight:squat,reps:8},{id:'s'+n+'b',exercise:'rumano',weight:rdl,reps:10},calf&&{id:'s'+n+'c',exercise:'gemelos',weight:calf,reps:15},crunch&&{id:'s'+n+'d',exercise:'crunch',weight:crunch,reps:15}].filter(Boolean)}));
 return {version:1,sessions:[...legs,...[28,21,14].map((n,i)=>({id:'demo-'+n,date:ago(n),note:'Sesión de ejemplo',tag:'Sin etiqueta',reviewed:false,sets:[{id:'s'+n+'a',exercise:'curl',weight:10+i,reps:10},{id:'s'+n+'b',exercise:'press',weight:40+i*5,reps:8},{id:'s'+n+'c',exercise:'remo',weight:30+i*5,reps:10}]}))],draft:null};
}
export function validSet(s,spec){return String(s.weight??'').trim()!==''&&Number.isFinite(Number(s.weight))&&(spec?.allowZero?Number(s.weight)>=0:Number(s.weight)>0)&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0&&Number(s.reps)<=100;}
export function ordered(sessions){return [...sessions].reverse().sort((a,b)=>b.date.localeCompare(a.date));}
export function lastSet(sessions,id){for(const session of ordered(sessions)){const rows=session.sets.filter(s=>s.exercise===id);if(rows.length)return {...rows[rows.length-1],date:session.date};}return null;}
export function series(sessions,id){return ordered(sessions).reverse().filter(s=>s.sets.some(x=>x.exercise===id)).map(s=>({date:s.date,weight:Math.max(...s.sets.filter(x=>x.exercise===id).map(x=>Number(x.weight)))}));}
export function updateSet(state,sessionId,setId,values){const row=state.sessions.find(s=>s.id===sessionId)?.sets.find(s=>s.id===setId);if(!row||!validSet(values,exercise(row.exercise,[...CATALOG,...(state.customExercises||[])])))throw new Error('Revisa los datos');return {...state,sessions:state.sessions.map(s=>s.id!==sessionId?s:{...s,sets:s.sets.map(x=>x.id!==setId?x:{...x,weight:Number(values.weight),reps:Number(values.reps)})})};}
export const MUSCLES=[
  {id:'pecho',name:'Pecho',side:'front'},{id:'hombros',name:'Hombros',side:'both'},{id:'biceps',name:'Bíceps',side:'front'},{id:'antebrazos',name:'Antebrazos',side:'both'},{id:'abdomen',name:'Abdomen',side:'front'},{id:'cuadriceps',name:'Cuádriceps',side:'front'},
  {id:'trapecio',name:'Trapecio',side:'back'},{id:'triceps',name:'Tríceps',side:'back'},{id:'espalda',name:'Espalda alta',side:'back'},{id:'lumbar',name:'Zona lumbar',side:'back'},{id:'gluteos',name:'Glúteos',side:'back'},{id:'isquios',name:'Isquiotibiales',side:'back'},{id:'gemelos',name:'Gemelos',side:'both'}
];
// Participación de cada músculo en los ejercicios del catálogo (1 = principal).
export const WORKS={curl:{biceps:1,antebrazos:.5},press:{pecho:1,triceps:.6,hombros:.6},remo:{espalda:1,biceps:.5,trapecio:.5,hombros:.3},sentadilla:{cuadriceps:1,gluteos:.6,lumbar:.3},rumano:{isquios:1,gluteos:.6,lumbar:.5,antebrazos:.3},gemelos:{gemelos:1},crunch:{abdomen:1}};
Object.assign(WORKS,{jalon:{espalda:1,biceps:.5},triceps:{triceps:1},militar:{hombros:1,triceps:.5},lateral:{hombros:1},martillo:{biceps:1,antebrazos:.5},prensa:{cuadriceps:1,gluteos:.5},hipthrust:{gluteos:1,isquios:.4},zancadas:{cuadriceps:1,gluteos:.6},bicepspolea:{biceps:1}});
export const WINDOW_DAYS=28;
export const LEVELS=['Sin registros','Baja','Media','Alta'];
export const workFor=(id,catalog=CATALOG)=>WORKS[id]||Object.fromEntries((exercise(id,catalog)?.muscles||[]).map(m=>[m,1]));
export const exercisesFor=(muscle,catalog=CATALOG)=>catalog.filter(e=>workFor(e.id,catalog)[muscle]).map(e=>e.id);
// Intensidad = carga de la última serie respecto de tu mayor carga en ese ejercicio,
// atenuada según los días transcurridos desde esa serie (0 al cumplir WINDOW_DAYS).
export function muscleLoad(sessions,muscle,now=new Date(),catalog=CATALOG){
 let best=null;
 for(const id of exercisesFor(muscle,catalog)){
  const last=lastSet(sessions,id);if(!last)continue;
  const days=daysSince(last.date,now);if(days>=WINDOW_DAYS)continue;
  const peak=Math.max(...sessions.flatMap(s=>s.sets).filter(x=>x.exercise===id).map(x=>Number(x.weight)));
  const relative=peak?Number(last.weight)/peak:1,recency=1-days/WINDOW_DAYS,share=workFor(id,catalog)[muscle],score=relative*recency*share;
  if(!best||score>best.score)best={exercise:id,weight:Number(last.weight),reps:last.reps,date:last.date,days,relative,recency,share,score};
 }
 if(!best)return {level:0,score:0,source:null};
 return {level:best.score<1/3?1:best.score<2/3?2:3,score:best.score,source:best};
}
export function recentWork(sessions,muscle,limit=5,catalog=CATALOG){const ids=exercisesFor(muscle,catalog);return ordered(sessions).map(s=>({id:s.id,date:s.date,sets:s.sets.filter(x=>ids.includes(x.exercise))})).filter(s=>s.sets.length).slice(0,limit);}

export const CONVENTIONS={
 mancuernas:{equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de una sola mancuerna, no la suma del par.',tag:'POR UNIDAD'},
 barra:{equipment:'Barra',unit:'kg totales con barra',help:'Incluye el peso de la barra y todos los discos.',tag:'TOTAL CON BARRA'},
 maquina:{equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina y compara solo con el mismo equipo.',tag:'MISMO EQUIPO'},
 polea:{equipment:'Polea',unit:'kg indicados en la polea',help:'Copia el valor de la pila de pesas y compara con la misma polea.',tag:'MISMO EQUIPO'},
 adicional:{equipment:'Peso corporal o lastre',unit:'kg adicionales',help:'Anota solo el lastre añadido. Si usas únicamente tu peso corporal, anota 0.',tag:'CARGA ADICIONAL',allowZero:true}
};
export function newDraft(now=new Date()){return {date:localDate(now),reviewed:false,note:'',tag:'Sin etiqueta',type:'Automático',sets:[]};}
export function migrateState(input,now=new Date()){
 const source=input&&[1,2].includes(input.version)&&Array.isArray(input.sessions)?input:seed(now);
 return {...source,version:2,customExercises:source.customExercises||[],editDraft:source.editDraft||null,
  draft:source.draft?{...source.draft,type:source.draft.type||'Automático',legacy:source.version===1||source.draft.legacy}:null};
}
export function validDate(value,today=localDate()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')||value>today)return false;
 const parsed=new Date(value+'T12:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export function validateDraft(d,catalog=CATALOG,today=localDate()){
 const errors=[];
 if(!validDate(d.date,today))errors.push({field:'date',message:'Elige una fecha válida, igual o anterior a hoy.'});
 if(!d.sets.length)errors.push({field:'sets',message:'Añade al menos un ejercicio y una serie.'});
 for(const row of d.sets){
  const spec=exercise(row.exercise,catalog);
  if(!spec)errors.push({id:row.id,message:'El ejercicio ya no está disponible.'});
  else if(!validSet(row,spec))errors.push({id:row.id,message:'Completa la carga '+(spec.allowZero?'(0 o más)':'(mayor que 0)')+' y repeticiones enteras entre 1 y 100.'});
 }
 return errors;
}
export function saveSession(state,d,id,catalog=CATALOG,today=localDate()){
 const errors=validateDraft(d,catalog,today);
 if(errors.length)throw new Error(errors[0].message);
 if(d.sessionId&&!state.sessions.some(s=>s.id===d.sessionId))throw new Error('No se encontró la sesión que quieres corregir.');
 const session={id:d.sessionId||id,date:d.date,note:d.note||'',tag:d.tag||'Sin etiqueta',type:d.type||'Automático',reviewed:!!d.reviewed,
  sets:d.sets.map(s=>({id:s.id,exercise:s.exercise,weight:Number(s.weight),reps:Number(s.reps)}))};
 if(d.sessionId)return {...state,sessions:state.sessions.map(s=>s.id===d.sessionId?session:s),editDraft:null};
 return {...state,sessions:[...state.sessions,session],draft:null};
}
const normalized=name=>String(name).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
export function createExercise(values,id,catalog=CATALOG){
 const name=String(values.name||'').trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>60)throw new Error('Escribe un nombre de 2 a 60 caracteres.');
 if(catalog.some(e=>normalized(e.name)===normalized(name)))throw new Error('Ese ejercicio ya existe. Búscalo en el catálogo.');
 const convention=CONVENTIONS[values.convention];
 if(!convention)throw new Error('Elige cómo anotar la carga.');
 const muscles=[...new Set(values.muscles||[])];
 if(!muscles.length||muscles.some(m=>!MUSCLES.some(x=>x.id===m)))throw new Error('Selecciona al menos un grupo muscular.');
 return {id,name,...convention,muscles,custom:true};
}
export const SESSION_TYPES=['Automático','Brazos','Tren superior','Piernas y core','Cuerpo completo','Personalizado'];
export function sessionType(s,catalog=CATALOG){
 if(s.type&&s.type!=='Automático')return s.type;
 const muscles=new Set(s.sets.flatMap(x=>Object.keys(workFor(x.exercise,catalog))));
 const upper=['biceps','triceps','pecho','espalda','hombros','trapecio','antebrazos'].some(m=>muscles.has(m));
 const lower=['cuadriceps','isquios','gluteos','gemelos'].some(m=>muscles.has(m));
 if(upper&&lower)return 'Cuerpo completo';
 if(lower||muscles.has('abdomen'))return 'Piernas y core';
 if([...muscles].every(m=>['biceps','triceps','antebrazos'].includes(m))&&muscles.size)return 'Brazos';
 return upper?'Tren superior':'Personalizado';
}
export function filterSessions(sessions,type='',muscle='',catalog=CATALOG){
 return ordered(sessions).filter(s=>(!type||sessionType(s,catalog)===type)&&(!muscle||s.sets.some(x=>workFor(x.exercise,catalog)[muscle])));
}
