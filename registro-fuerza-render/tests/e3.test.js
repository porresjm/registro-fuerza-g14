import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,series,lastSet,muscleLoad,recentWork,CATALOG,localDate,newDraft,migrateState,validateDraft,saveSession,createExercise,validDate,sessionType,filterSessions} from '../dist/model.js';
const today='2026-11-24';
const draftWith=sets=>({...newDraft(new Date(today+'T12:00:00')),sets});
test('una sesión nueva empieza vacía y usa la fecha local de inicio',()=>{
 const now=new Date(2026,10,24,23,50);
 assert.equal(newDraft(now).date,localDate(now));assert.deepEqual(newDraft(now).sets,[]);
 assert.ok(validateDraft(newDraft(now),CATALOG,today).some(e=>e.field==='sets'));
});
test('guardar todas las series es atómico y no requiere confirmaciones intermedias',()=>{
 const original=migrateState(null,new Date(today+'T12:00:00'));
 const d=draftWith([{id:'a',exercise:'curl',weight:'12',reps:'10'},{id:'b',exercise:'curl',weight:'14',reps:'8'}]);
 const changed=saveSession(original,d,'nueva',CATALOG,today);
 assert.equal(changed.sessions.length,original.sessions.length+1);
 assert.equal(changed.sessions.at(-1).sets.length,2);assert.equal(changed.sessions.at(-1).sets[1].weight,14);
 assert.equal(original.sessions.length,6);assert.equal(changed.draft,null);
});
test('una serie incompleta impide guardar toda la sesión sin perder el borrador',()=>{
 const original=migrateState(null),d=draftWith([{id:'a',exercise:'curl',weight:'12',reps:10},{id:'b',exercise:'curl',weight:'',reps:8}]);
 original.draft=d;const before=structuredClone(original);
 assert.throws(()=>saveSession(original,d,'fallo',CATALOG,today));
 assert.deepEqual(original,before);assert.equal(validateDraft(d,CATALOG,today)[0].id,'b');
});
test('la validación rechaza fechas imposibles, futuras y ejercicios desconocidos',()=>{
 for(const day of ['2026-02-30','2026-13-01','2026-11-25',''])assert.equal(validDate(day,today),false);
 assert.equal(validDate('2024-02-29',today),true);
 assert.ok(validateDraft(draftWith([{id:'a',exercise:'inexistente',weight:10,reps:10}]),CATALOG,today).length);
});
test('la corrección completa conserva el id, no duplica la sesión y recalcula las referencias',()=>{
 const original=migrateState(null,new Date(today+'T12:00:00'));
 const session=original.sessions.find(s=>s.id==='demo-14');
 const d={...structuredClone(session),sessionId:session.id,date:today,sets:[{id:'a',exercise:'curl',weight:30,reps:8},{id:'b',exercise:'sentadilla',weight:70,reps:8}]};
 const changed=saveSession(original,d,'no-usar',CATALOG,today);
 assert.equal(changed.sessions.length,6);assert.equal(changed.sessions.find(s=>s.id===session.id).date,today);
 assert.equal(series(changed.sessions,'curl').at(-1).weight,30);
 assert.equal(sessionType(changed.sessions.find(s=>s.id===session.id)),'Cuerpo completo');
 assert.equal(changed.editDraft,null);assert.equal(session.date,'2026-11-10');
});
test('la migración conserva sesiones, fecha y valores de borradores de la E2',()=>{
 const old=seed(new Date(today+'T12:00:00'));
 old.draft={date:'2026-11-20',note:'Mi dato',sets:[{id:'a',exercise:'curl',weight:'15',reps:'8',done:false}]};
 const changed=migrateState(old);
 assert.equal(changed.version,2);assert.deepEqual(changed.sessions,old.sessions);
 assert.equal(changed.draft.date,'2026-11-20');assert.equal(changed.draft.sets[0].weight,'15');assert.equal(changed.draft.legacy,true);
 assert.deepEqual(old.draft.sets,changed.draft.sets);
});
test('los ejercicios personalizados alimentan historial, evolución y mapa muscular',()=>{
 const e=createExercise({name:'Dominadas con lastre',convention:'adicional',muscles:['espalda','biceps']},'custom-1');
 const catalog=[...CATALOG,e],d=draftWith([{id:'a',exercise:e.id,weight:0,reps:8}]);
 const changed=saveSession(migrateState(null),d,'custom-session',catalog,today);
 assert.equal(lastSet(changed.sessions,e.id).weight,0);
 assert.equal(series(changed.sessions,e.id).at(-1).weight,0);
 assert.equal(muscleLoad(changed.sessions,'espalda',new Date(today+'T12:00:00'),catalog).source.exercise,e.id);
 assert.equal(filterSessions(changed.sessions,'','biceps',catalog)[0].id,'custom-session');
 assert.equal(recentWork(changed.sessions,'espalda',5,catalog)[0].id,'custom-session');
});
test('no acepta ejercicios duplicados ni sin convención o músculos',()=>{
 assert.throws(()=>createExercise({name:' Cúrl de bíceps ',convention:'mancuernas',muscles:['biceps']},'x'));
 assert.throws(()=>createExercise({name:'Nuevo',convention:'otra',muscles:['biceps']},'x'));
 assert.throws(()=>createExercise({name:'Nuevo',convention:'barra',muscles:[]},'x'));
});
test('los filtros combinan tipo y músculo sin alterar ni reordenar el estado original',()=>{
 const sessions=[
  {id:'a',date:'2026-11-20',sets:[{exercise:'curl',weight:10,reps:10}]},
  {id:'b',date:today,sets:[{exercise:'curl',weight:12,reps:10},{exercise:'sentadilla',weight:60,reps:8}]}
 ];
 const copy=structuredClone(sessions);
 assert.equal(filterSessions(sessions,'Brazos','biceps')[0].id,'a');
 assert.equal(filterSessions(sessions,'Cuerpo completo','biceps')[0].id,'b');
 assert.deepEqual(filterSessions(sessions,'Brazos','cuadriceps'),[]);assert.deepEqual(sessions,copy);
});

test('el agarre secundario de un ejercicio de piernas no lo convierte en cuerpo completo',()=>{
 const legs=seed(new Date(today+'T12:00:00')).sessions.filter(s=>s.id==='demo-10'||s.id==='demo-17'||s.id==='demo-24');
 assert.ok(legs.every(s=>sessionType(s)==='Piernas y core'));
 assert.deepEqual(filterSessions(legs,'Cuerpo completo'),[]);
 assert.equal(sessionType({sets:[{exercise:'sentadilla'},{exercise:'curl'}]}),'Cuerpo completo');
});
