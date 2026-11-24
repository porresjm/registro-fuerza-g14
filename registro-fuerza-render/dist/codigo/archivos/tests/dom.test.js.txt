import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {localDate,STORAGE_KEY,seed} from '../dist/model.js';
process.env.TZ='America/Santiago';
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
let dom,document,run=0;
const checks=[];
async function load(saved){
 dom?.window.close();dom=new JSDOM(html,{url:'https://registro-fuerza.test/#cuerpo',pretendToBeVisual:true});
 const w=dom.window;
 w.scrollTo=()=>{};w.matchMedia=()=>({matches:false});
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(saved)w.localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));
 Object.assign(globalThis,{window:w,document:w.document,location:w.location,localStorage:w.localStorage,matchMedia:w.matchMedia});
 document=w.document;
 await import('../dist/app.js?dom-test-'+(++run));
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
const q=selector=>{const node=document.querySelector(selector);assert.ok(node,'No se encontró '+selector);return node;};
async function click(selector){q(selector).click();await tick();}
function input(selector,value,event='input'){const node=q(selector);node.value=String(value);node.dispatchEvent(new dom.window.Event(event,{bubbles:true}));}
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY));
async function add(id,weight,reps){
 input('#add-exercise',id,'change');await click('[data-action="add-exercise"]');
 input('[data-exercise-card="'+id+'"] [data-field="weight"]',weight);
 input('[data-exercise-card="'+id+'"] [data-field="reps"]',reps);
}
test('integración DOM de las tareas de la E3',async t=>{
 await load();
 const scenario=async(name,fn)=>{await t.test(name,fn);checks.push(name);};
 await scenario('acceso principal visible y editor sin series por defecto',async()=>{
  await click('.title-row a[href="#entrenar"]');
  assert.equal(document.querySelectorAll('[data-set]').length,0);
  assert.equal(q('#session-date').value,localDate());assert.ok(q('#save-session').disabled);
 });
 await scenario('T1 registra bíceps con dos series usando una sola acción',async()=>{
  await add('curl',12,10);await click('[data-action="add-series"]');
  assert.ok(q('#save-session').disabled);
  const rows=document.querySelectorAll('[data-set]');
  input('[data-set="'+rows[1].dataset.set+'"] [data-field="weight"]',14);
  input('[data-set="'+rows[1].dataset.set+'"] [data-field="reps"]',8);
  assert.equal(document.querySelectorAll('[data-action="set"]').length,0);
  await click('#save-session');
  assert.equal(stored().sessions.length,7);
  assert.match(q('#app').textContent,/Sesión|sesiones/);
  assert.equal(q('.history-card').querySelectorAll('tbody tr').length,2);
  assert.match(q('#toast').textContent,/Sesión guardada en el historial/);
  assert.equal(q('#modal').open,false);
 });
 await scenario('T2 encuentra el último entrenamiento de brazos con filtros',async()=>{
  input('#history-type','Brazos','change');input('#history-muscle','biceps','change');
  assert.equal(document.querySelectorAll('.history-card').length,1);
  assert.match(q('.history-card').textContent,/Brazos/);
  await click('[data-action="clear-filters"]');
 });
 await scenario('crear un ejercicio propio conserva convención y músculos',async()=>{
  await click('.title-row a[href="#entrenar"]');await add('curl',14,10);await add('sentadilla',70,8);
  await click('[data-action="custom"]');
  input('#custom-name','Press inclinado QA');input('#custom-convention','mancuernas','change');
  q('[name="custom-muscle"][value="pecho"]').checked=true;
  q('[name="custom-muscle"][value="hombros"]').checked=true;
  q('#custom-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(q('#modal').open,false);
  const spec=stored().customExercises[0];
  input('[data-exercise-card="'+spec.id+'"] [data-field="weight"]',18);
  input('[data-exercise-card="'+spec.id+'"] [data-field="reps"]',10);
  await click('#save-session');
  assert.equal(stored().sessions.length,8);assert.match(q('.history-card').textContent,/Cuerpo completo/);
 });
 await scenario('T3 corrige una sesión completa sin duplicarla y actualiza su fecha',async()=>{
  input('#history-type','Cuerpo completo','change');await click('[data-action="edit-session"]');
  const d=stored().editDraft,day=new Date();day.setDate(day.getDate()-1);
  input('#session-date',localDate(day));input('[data-exercise-card="curl"] [data-field="weight"]',20);
  await click('[data-exercise-card="curl"] [data-action="add-series"]');
  const rows=document.querySelectorAll('[data-exercise-card="curl"] [data-set]');
  input('[data-set="'+rows[1].dataset.set+'"] [data-field="weight"]',19);
  input('[data-set="'+rows[1].dataset.set+'"] [data-field="reps"]',8);
  await click('#save-session');
  const saved=stored().sessions.find(s=>s.id===d.sessionId);
  assert.equal(stored().sessions.length,8);assert.equal(saved.date,localDate(day));
  assert.equal(saved.sets.length,4);assert.equal(saved.sets[0].weight,20);
 });
 await scenario('el catálogo personalizado y sus sesiones sobreviven a la recarga',async()=>{
  const saved=stored();await load(saved);
  assert.equal(stored().sessions.length,8);assert.equal(stored().customExercises[0].name,'Press inclinado QA');
  assert.match(q('.muscle-detail').textContent,/registros|serie|entrenamientos/);
 });
 await scenario('mapa muscular y evolución incluyen el ejercicio personalizado',async()=>{
  await click('.muscle-list [data-muscle="pecho"]');
  assert.match(q('.muscle-detail').textContent,/Press inclinado QA/);
  await click('[data-nav="progreso"]');
  input('#exercise-select',stored().customExercises[0].id,'change');
  assert.match(q('.session-table').textContent,/18/);assert.ok(q('.chart'));
 });
 await scenario('cancelar permite conservar un borrador',async()=>{
  await click('[data-nav="entrenar"]');await add('triceps',15,10);
  await click('[data-action="cancel"]');await click('#keep-draft');await click('[data-nav="entrenar"]');
  assert.equal(q('[data-field="weight"]').value,'15');
 });
 await scenario('descartar el borrador puede deshacerse',async()=>{
  await click('[data-action="cancel"]');await click('#discard-draft');
  assert.equal(stored().draft,null);await click('#undo');await click('[data-nav="entrenar"]');
  assert.equal(q('[data-field="weight"]').value,'15');
 });
 await scenario('las referencias son opcionales y explican el efecto de marcarlas',async()=>{
  q('.references').open=true;q('#references-reviewed').click();
  assert.equal(stored().draft.reviewed,true);
  assert.match(q('#review-status').textContent,/Tus cargas no cambian/);
  assert.equal(stored().draft.sets[0].weight,'15');
 });
 await scenario('las fechas inválidas se detectan antes de guardar',async()=>{
  input('#session-date','2099-01-01');
  assert.ok(q('#save-session').disabled);assert.match(q('#save-hint').textContent,/fecha válida/);
  input('#session-date',localDate());assert.equal(q('#save-session').disabled,false);
 });
 await scenario('la migración no borra un borrador anterior y permite limpiarlo con deshacer',async()=>{
  const old=seed();
  old.draft={date:'2026-11-20',note:'Conservar',sets:[{id:'x',exercise:'curl',weight:11,reps:8,done:true},{id:'y',exercise:'press',weight:45,reps:8,done:false}]};
  await load(old);await click('[data-nav="entrenar"]');
  assert.equal(q('#session-date').value,'2026-11-20');assert.equal(document.querySelectorAll('[data-set]').length,2);
  await click('[data-action="clear-legacy"]');assert.equal(document.querySelectorAll('[data-set]').length,1);
  await click('#undo');assert.equal(document.querySelectorAll('[data-set]').length,2);
 });
 console.log(JSON.stringify({plannedDomCases:checks.length,checks}));
 dom.window.close();
});
