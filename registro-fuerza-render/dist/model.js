export const CATALOG = [
  {id:'curl',name:'Curl de bíceps',equipment:'Mancuernas',unit:'kg por mancuerna',help:'Anota el peso de UNA mancuerna. Dos mancuernas de 12 kg se registran como 12 kg, no 24.'},
  {id:'press',name:'Press de banca',equipment:'Barra',unit:'kg totales con barra',help:'Incluye la barra y todos los discos. Barra de 20 kg + 10 kg por lado = 40 kg.'},
  {id:'remo',name:'Remo sentado',equipment:'Máquina',unit:'kg indicados en la máquina',help:'Copia el valor de la máquina. Compara solo con el mismo equipo; las máquinas pueden diferir.'}
];
export const STORAGE_KEY='g14-fuerza-v1';
export const exercise=id=>CATALOG.find(e=>e.id===id);
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function daysSince(date,now=new Date()){return Math.max(0,Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.parse(date+'T00:00:00Z'))/86400000));}
export function seed(now=new Date()){
 const ago=n=>{let d=new Date(now);d.setDate(d.getDate()-n);return localDate(d);};
 return {version:1,sessions:[28,21,14].map((n,i)=>({id:'demo-'+n,date:ago(n),note:'Sesión de ejemplo',tag:'Sin etiqueta',reviewed:false,sets:[{id:'s'+n+'a',exercise:'curl',weight:10+i,reps:10},{id:'s'+n+'b',exercise:'press',weight:40+i*5,reps:8},{id:'s'+n+'c',exercise:'remo',weight:30+i*5,reps:10}]})),draft:null};
}
export function validSet(s){return Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0&&Number(s.reps)<=100;}
export function ordered(sessions){return [...sessions].reverse().sort((a,b)=>b.date.localeCompare(a.date));}
export function lastSet(sessions,id){for(const session of ordered(sessions)){const rows=session.sets.filter(s=>s.exercise===id);if(rows.length)return {...rows[rows.length-1],date:session.date};}return null;}
export function series(sessions,id){return ordered(sessions).reverse().filter(s=>s.sets.some(x=>x.exercise===id)).map(s=>({date:s.date,weight:Math.max(...s.sets.filter(x=>x.exercise===id).map(x=>Number(x.weight)))}));}
export function updateSet(state,sessionId,setId,values){if(!validSet(values))throw new Error('Revisa los datos');return {...state,sessions:state.sessions.map(s=>s.id!==sessionId?s:{...s,sets:s.sets.map(x=>x.id!==setId?x:{...x,weight:Number(values.weight),reps:Number(values.reps)})})};}
