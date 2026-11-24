
import {CATALOG,STORAGE_KEY,exercise as findExercise,localDate,daysSince,ordered,lastSet,series,MUSCLES,LEVELS,WINDOW_DAYS,exercisesFor,muscleLoad,recentWork,CONVENTIONS,SESSION_TYPES,newDraft,migrateState,validateDraft,saveSession,createExercise,sessionType,filterSessions} from './model.js';
let state,storageWorks=true;
try {state=migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}
catch {state=migrateState(null);storageWorks=false;}
let view=location.hash.slice(1)||'cuerpo',selectedExercise='curl',selectedMuscle=null;
let undoState=null,toastTimer,historyType='',historyMuscle='';
const app=document.querySelector('#app'),modal=document.querySelector('#modal');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-CL',{maximumFractionDigits:2});
const date=x=>new Date(x+'T12:00:00').toLocaleDateString('es-CL',{day:'numeric',month:'short',year:'numeric'});
const uid=()=>crypto.randomUUID?.()??('registro-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const catalog=()=>[...CATALOG,...state.customExercises];
const exercise=id=>findExercise(id,catalog())||{name:'Ejercicio no disponible',unit:'kg',help:'',equipment:''};
const button=(action,text,extra='',kind='outline')=>`<button type="button" class="${kind}" data-action="${action}" ${extra}>${text}</button>`;
function persist(){try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageWorks=true;return true;}catch {storageWorks=false;return false;}}
function toast(message,undo=false){
 const el=document.querySelector('#toast');el.innerHTML=esc(message)+(undo?' <button type="button" id="undo">Deshacer</button>':'');
 el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),10000);
 if(undo)el.querySelector('button').onclick=()=>{if(undoState){state=undoState;undoState=null;persist();render();toast('Cambio deshecho');}};
}
function snapshot(){undoState=structuredClone(state);}
function draft(){if(state.editDraft)return state.editDraft;if(!state.draft){state.draft=newDraft();persist();}return state.draft;}
function go(next){view=next;if(location.hash!=='#'+next)location.hash=next;else render();window.scrollTo(0,0);}
function openModal(html){document.querySelector('#modal-body').innerHTML=html;modal.showModal();}
function persistStatus(){return storageWorks?'Borrador conservado en este navegador. Aún no está en el historial.':'No se pudo guardar en el navegador. Mantén esta pestaña abierta para no perder los datos.';}
function draftHint(d){const errors=validateDraft(d,catalog());return errors.length?errors[0].message:`${d.sets.length} ${d.sets.length===1?'serie lista':'series listas'}. Guarda la sesión una sola vez para incorporarla al historial.`;}
function syncStatus(){
 const d=draft(),errors=validateDraft(d,catalog()),status=document.querySelector('#draft-status');
 if(status){status.textContent=persistStatus();status.classList.toggle('error',!storageWorks);}
 const hint=document.querySelector('#save-hint');if(hint)hint.textContent=draftHint(d);
 const save=document.querySelector('#save-session');if(save)save.disabled=!!errors.length;
 for(const row of d.sets){
  const error=errors.find(e=>e.id===row.id),node=app.querySelector(`[data-set="${row.id}"]`);if(!node)continue;
  node.querySelector('[data-row-error]').textContent=error?.message||'';
  node.querySelectorAll('input').forEach(input=>input.setAttribute('aria-invalid',String(!!error)));
 }
}
function references(d){
 const last=ordered(state.sessions)[0],gap=last?daysSince(last.date):0;
 return `<details class="references"><summary>Consultar cargas anteriores (opcional)${gap>=7?' · último registro hace '+gap+' días':''}</summary>
 <p>Son datos históricos. Consultarlos o marcar esta revisión no cambia tus cargas ni tus sesiones anteriores, y no es necesario para guardar el entrenamiento.</p>
 <div class="reference-list">${catalog().map(e=>{const prior=lastSet(state.sessions,e.id);return prior?`<p><strong>${esc(e.name)}</strong>: ${fmt(prior.weight)} ${e.unit} × ${prior.reps} rep. · ${date(prior.date)}</p>`:'';}).join('')}</div>
 <label class="check-label"><input id="references-reviewed" type="checkbox" ${d.reviewed?'checked':''}>Marcar referencias como revisadas para esta sesión</label>
 <p id="review-status" class="tiny">${d.reviewed?'La sesión quedará etiquetada como referencias revisadas. Tus cargas no cambian.':'Sin marcar: la sesión se puede guardar igualmente.'}</p></details>`;
}
function setRow(row,index){
 const e=exercise(row.exercise),old=lastSet(state.sessions,e.id),high=old&&Number(row.weight)>=Number(old.weight)*2;
 return `<div class="set-entry"><div class="set-grid" data-set="${row.id}">
 <span class="set-number">${index+1}</span>
 <label>${e.unit}<input data-field="weight" aria-describedby="error-${row.id}" aria-label="${esc(e.name)} serie ${index+1} carga ${e.unit}" type="number" min="${e.allowZero?0:.01}" step="any" inputmode="decimal" value="${esc(row.weight)}"></label>
 <label>Repeticiones<input data-field="reps" aria-describedby="error-${row.id}" aria-label="${esc(e.name)} serie ${index+1} repeticiones" type="number" min="1" max="100" step="1" inputmode="numeric" value="${esc(row.reps)}"></label>
 ${button('remove','×',`data-id="${row.id}" aria-label="Quitar serie ${index+1} de ${esc(e.name)}"`,'remove')}
 <p class="row-error" data-row-error id="error-${row.id}"></p></div>
 ${high?`<p class="weight-hint">La carga es al menos el doble de tu último registro. Verifica que estés anotando ${e.unit}.</p>`:''}</div>`;
}
function training(){
 const d=draft(),editing=!!d.sessionId,ids=[...new Set(d.sets.map(s=>s.exercise))];
 return `<div class="title-row"><div><span class="eyebrow">${editing?'CORRIGE SIN REHACER TU SESIÓN':'TU SESIÓN, A TU RITMO'}</span>
 <h1>${editing?'Corregir entrenamiento.':'Registra tu entrenamiento.'}</h1>
 <p class="sub">Añade los ejercicios que hiciste, completa sus series y guarda todo al terminar.</p></div>${button('cancel','Cancelar sesión')}</div>
 <p id="draft-status" class="draft-status" role="status">${persistStatus()}</p>
 <section class="card quick-help"><h2>Cómo registrar una sesión</h2><ol>
 <li>Añade un ejercicio del catálogo o crea uno propio.</li><li>Completa su carga y repeticiones; puedes añadir más series.</li>
 <li>Pulsa «${editing?'Guardar corrección':'Guardar sesión'}». La sesión aparecerá en el historial.</li></ol></section>
 ${d.legacy?`<div class="callout"><p>Este borrador viene de la versión anterior. Conservamos sus datos; puedes retirar en una sola acción las series que no habías confirmado.</p>${button('clear-legacy','Quitar series no confirmadas')}</div>`:''}
 <form id="session-form" novalidate>
 <section class="card"><h2>Datos de la sesión</h2><div class="field-grid">
 <label>Fecha del entrenamiento<input id="session-date" type="date" max="${localDate()}" value="${esc(d.date)}"></label>
 <label>Tipo de entrenamiento<select id="session-type">${SESSION_TYPES.map(t=>`<option ${d.type===t?'selected':''}>${t}</option>`).join('')}</select></label></div>
 ${d.date!==localDate()?`<p class="date-note">Estás registrando una sesión del ${date(d.date)}. ${button('today','Usar la fecha de hoy','','text-button')}</p>`:'<p class="tiny muted">La fecha de hoy se usa al iniciar una sesión nueva. Puedes registrar una sesión anterior.</p>'}
 <p class="tiny muted">«Automático» identifica el tipo según los músculos de los ejercicios añadidos.</p></section>
 ${references(d)}
 <section class="card"><h2>Añadir ejercicio</h2><div class="picker">
 <label>Buscar ejercicio<input id="exercise-search" type="search" placeholder="Ej. bíceps, tríceps o sentadilla"></label>
 <label>Ejercicio<select id="add-exercise">${catalog().map(e=>`<option value="${e.id}">${esc(e.name)} · ${e.equipment}</option>`).join('')}</select></label>
 ${button('add-exercise','Añadir ejercicio','','secondary')}</div>
 <p id="search-status" class="tiny muted"></p>${button('custom','+ Crear ejercicio personalizado','','text-button')}
 <p class="tiny muted">Los ejercicios personalizados se conservan en este navegador y aparecen en historial, evolución y mapa muscular.</p></section>
 <div id="session-exercises">${ids.length?ids.map(id=>{
 const e=exercise(id),prior=lastSet(state.sessions,id),rows=d.sets.filter(s=>s.exercise===id);
 return `<section class="card exercise-card" data-exercise-card="${id}">
 <div class="exercise-head"><div><div class="equipment">${e.equipment}</div><h2>${esc(e.name)}</h2></div><span class="badge">${e.tag||'CARGA MANUAL'}</span></div>
 <div class="convention">${esc(e.help)}</div>
 <p class="previous">${prior?`Último registro: <strong>${fmt(prior.weight)} ${e.unit} × ${prior.reps} rep.</strong> · ${date(prior.date)}. Referencia, no valor precargado.`:'Aún no hay una referencia para este ejercicio.'}</p>
 ${rows.map(setRow).join('')}${button('add-series','+ Añadir serie',`data-exercise="${id}"`,'text-button add-set')}</section>`;
 }).join(''):'<div class="empty">Todavía no has añadido ejercicios. Solo registrarás las series que agregues.</div>'}</div>
 <section class="card"><h2>El contexto también cuenta</h2><div class="field-grid">
 <label>Nota de la sesión (opcional)<textarea id="session-note" maxlength="500" placeholder="Equipo distinto, pausa, observaciones…">${esc(d.note)}</textarea></label>
 <label>Etiqueta personal (opcional)<input id="session-tag" maxlength="40" value="${esc(d.tag)}"></label></div></section>
 <div class="finish"><div><strong>${d.sets.length} ${d.sets.length===1?'serie añadida':'series añadidas'}</strong><p id="save-hint">${draftHint(d)}</p></div>
 <button type="submit" class="primary" id="save-session" aria-describedby="save-hint" ${validateDraft(d,catalog()).length?'disabled':''}>${editing?'Guardar corrección':'Guardar sesión'} ↗</button></div>
 <p id="session-error" class="error" role="alert"></p></form>`;
}
function history(){
 const sessions=filterSessions(state.sessions,historyType,historyMuscle,catalog());
 return `<div class="title-row"><div><span class="eyebrow">LO QUE YA HICISTE</span><h1>Tu historial de entrenamientos.</h1><p class="sub">Filtra por tipo o músculo. Las sesiones más recientes aparecen primero.</p></div><a href="#entrenar" class="primary action-link">Registrar entrenamiento ↗</a></div>
 <section class="card history-filters"><label>Tipo de entrenamiento<select id="history-type"><option value="">Todos los tipos</option>${SESSION_TYPES.filter(t=>t!=='Automático').map(t=>`<option ${historyType===t?'selected':''}>${t}</option>`).join('')}</select></label>
 <label>Grupo muscular<select id="history-muscle"><option value="">Todos los músculos</option>${MUSCLES.map(m=>`<option value="${m.id}" ${historyMuscle===m.id?'selected':''}>${m.name}</option>`).join('')}</select></label>
 ${button('clear-filters','Limpiar filtros')}<p class="tiny muted" role="status">${sessions.length} de ${state.sessions.length} sesiones</p></section>
 ${sessions.map(s=>`<section class="card history-card" id="session-${s.id}">
 <div class="split history-title"><div><h2>${sessionType(s,catalog())} · ${date(s.date)}</h2><span class="detail-tag">${esc(s.tag)}${s.reviewed?' · referencias revisadas':''}</span></div>${button('edit-session','Corregir sesión',`data-session="${s.id}"`)}</div>
 <p class="exercise-summary">${[...new Set(s.sets.map(x=>exercise(x.exercise).name))].map(esc).join(' · ')}</p>
 ${s.note?`<p class="tiny muted">${esc(s.note)}</p>`:''}
 <div class="table-scroll"><table class="session-table"><thead><tr><th>Ejercicio</th><th>Carga</th><th>Rep.</th></tr></thead><tbody>
 ${s.sets.map(x=>`<tr><td>${esc(exercise(x.exercise).name)}</td><td>${fmt(x.weight)} ${exercise(x.exercise).unit}</td><td>${x.reps}</td></tr>`).join('')}</tbody></table></div></section>`).join('')||'<div class="empty"><h2>No hay sesiones para estos filtros</h2><p>Prueba con otro tipo o músculo, o limpia los filtros. Si aún no has entrenado, registra tu primera sesión.</p></div>'}`;
}

function progress(){const points=series(state.sessions,selectedExercise);const e=exercise(selectedExercise);const max=points.length?Math.max(...points.map(x=>x.weight)):0;const min=points.length?Math.min(...points.map(x=>x.weight)):0;const range=Math.max(1,max-min);const coords=points.map((p,i)=>({x:30+(i*(640/(Math.max(1,points.length-1)))),y:145-(p.weight-min)*100/range}));return `<div class="title-row"><div><span class="eyebrow">TUS DATOS, A LA VISTA</span><h1>Compara tus registros.</h1><p class="sub">Mismo ejercicio, misma convención. Sin rankings ni percentiles.</p></div></div><section class="card"><div class="split"><h2>Mayor carga por sesión</h2><label>Ejercicio<select id="exercise-select">${catalog().map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div><p class="tiny muted">${e.unit}. Máximo de las cargas guardadas para este ejercicio en cada sesión. No estima fuerza: repeticiones y contexto pueden variar.</p>${points.length?`<svg class="chart" viewBox="0 0 700 180" role="img" aria-label="Evolución de la mayor carga de ${esc(e.name)}. Los valores se detallan en la tabla."><path d="M30 155H675" stroke="#dedfd5" fill="none"/><polyline points="${coords.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#dc552b" stroke-width="3"/>${coords.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#dc552b"/><text x="${p.x}" y="${p.y-14}" text-anchor="middle" font-size="13" fill="#20251f">${fmt(points[i].weight)} kg</text>`).join('')}</svg><div class="chart-labels"><span>${date(points[0].date)}</span><span>${date(points.at(-1).date)}</span></div><table class="session-table"><thead><tr><th>Fecha</th><th>Mayor carga registrada</th><th>Convención</th></tr></thead><tbody>${points.map(p=>`<tr><td>${date(p.date)}</td><td>${fmt(p.weight)} kg</td><td>${e.unit}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">Guarda una serie de este ejercicio para empezar.</p>'}</section><div class="aside-card"><h2>¿Ves un dato equivocado?</h2><p>Corrígelo en el historial. Esta vista se recalcula al instante desde tus sesiones guardadas.</p><a href="#historial" class="tiny">Ir al historial →</a></div>`;}

// Silueta en dos vistas. Las formas con mirror se dibujan en la mitad izquierda y se reflejan.
const SHOULDER='M73 67C60 66 50 74 49 88C49 96 51 102 53 106C57 96 64 90 74 87Z',UPPER_ARM='M51 110C46 120 45 134 47 148L57 150C61 138 64 122 63 104C59 104 54 106 51 110Z',FOREARM='M46 153C42 168 40 184 40 198L48 200C52 186 56 170 57 154Z';
const SILHOUETTE=[['M100 11C109 11 115 19 115 30C115 41 109 49 100 49C91 49 85 41 85 30C85 19 91 11 100 11Z'],['M92 46L108 46L110 60L90 60Z'],['M43 201C49 201 51 207 50 214C49 220 45 222 41 220C37 217 36 209 38 204C39 202 41 201 43 201Z',1],['M84 272C90 272 94 275 94 279C94 283 90 285 84 285C78 285 74 283 74 279C74 275 78 272 84 272Z',1],['M77 370L89 370L92 384L70 384C70 378 73 374 77 370Z',1]];
const FIGURE={
 front:[['trapecio','M90 54L74 66L92 64Z',1],['hombros',SHOULDER,1],['pecho','M97 68L76 70C70 78 68 92 72 104C82 110 92 110 97 106Z',1],['biceps',UPPER_ARM,1],['antebrazos',FOREARM,1],['abdomen','M85 112L115 112L113 172C107 180 93 180 87 172Z'],['abdomen','M73 108C72 128 74 150 80 170L84 172L83 112Z',1],['cuadriceps','M80 180C71 206 69 238 73 268L95 270C99 242 99 210 98 194C92 190 85 186 80 180Z',1],['gemelos','M74 288C70 314 72 342 76 366L88 366C92 342 94 314 93 288Z',1]],
 back:[['trapecio','M100 50L84 62L72 67L88 74L100 112L112 74L128 67L116 62Z'],['hombros',SHOULDER,1],['triceps',UPPER_ARM,1],['antebrazos',FOREARM,1],['espalda','M86 77C78 82 73 90 73 102C74 116 78 128 84 140L98 145L98 118Z',1],['lumbar','M88 149L112 149L113 172L87 172Z'],['gluteos','M98 177L80 179C74 189 74 202 80 212C88 218 96 216 99 210Z',1],['isquios','M80 216C72 234 71 252 74 268L95 268C98 252 98 234 98 220C92 222 85 221 80 216Z',1],['gemelos','M74 288C68 304 69 322 76 340C80 352 86 352 90 340C95 322 95 304 93 288Z',1]]
};
const BACK_LEG='M77 350L88 350L88 366L77 366Z';
const MIRROR=' transform="matrix(-1 0 0 1 200 0)"';
const shape=(d,mirror)=>`<path d="${d}"/>`+(mirror?`<path d="${d}"${MIRROR}/>`:'');
const levelName=l=>l===0?'sin registros recientes':'intensidad '+LEVELS[l].toLowerCase();
function figure(side,label,loads){const groups={};for(const [m,d,mirror] of FIGURE[side])(groups[m]??=[]).push(shape(d,mirror));
 const base=SILHOUETTE.map(([d,mirror])=>shape(d,mirror)).join('')+(side==='back'?shape(BACK_LEG,1):'');
 return `<figure class="body-figure"><svg viewBox="0 0 200 392" role="group" aria-label="Vista de ${label.toLowerCase()}"><g class="silhouette" aria-hidden="true">${base}</g>${Object.entries(groups).map(([m,paths])=>{const info=MUSCLES.find(x=>x.id===m),l=loads[m].level;return `<g class="muscle l${l}${m===selectedMuscle?' selected':''}" data-muscle="${m}" tabindex="0" role="button" aria-pressed="${m===selectedMuscle}" aria-label="${info.name}, ${levelName(l)}"><title>${info.name} · ${LEVELS[l]}</title>${paths.join('')}</g>`;}).join('')}</svg><figcaption>${label}</figcaption></figure>`;}
function muscleDetail(id,load){const m=MUSCLES.find(x=>x.id===id),ids=exercisesFor(id,catalog()),work=recentWork(state.sessions,id,5,catalog()),src=load.source;
 const why=!ids.length?`Ningún ejercicio de esta versión trabaja este grupo. Por ahora se registran ${CATALOG.slice(0,-1).map(e=>e.name.toLowerCase()).join(', ')} y ${CATALOG.at(-1).name.toLowerCase()}.`
  :src?`Última serie que lo trabaja: <strong>${esc(exercise(src.exercise).name)}, ${fmt(src.weight)} ${exercise(src.exercise).unit} × ${src.reps} rep.</strong>, hace ${src.days} ${src.days===1?'día':'días'}. Es el ${Math.round(src.relative*100)} % de tu mayor carga registrada en ese ejercicio${src.share<1?'; aquí trabaja como músculo secundario':''}.`
  :`No hay series de ${ids.map(x=>esc(exercise(x).name.toLowerCase())).join(' ni ')} en los últimos ${WINDOW_DAYS} días.`;
 return `<div class="detail-head"><span class="swatch l${load.level}" aria-hidden="true"></span><h2>${m.name}</h2><span class="badge level-badge">${LEVELS[load.level]}</span></div><p class="why">${why}</p>${work.length?`<h3>Últimos entrenamientos</h3><ol class="recent">${work.map(s=>`<li><div class="split"><strong>${date(s.date)}</strong><span class="tiny muted">hace ${daysSince(s.date)} días</span></div>${s.sets.map(x=>`<div class="recent-set"><span>${esc(exercise(x.exercise).name)}</span><span class="num">${fmt(x.weight)} kg × ${x.reps}</span></div>`).join('')}</li>`).join('')}</ol><a class="tiny" href="#historial">Corregir un dato en el historial →</a>`:ids.length?'<p class="tiny muted">Todavía no hay series guardadas para este grupo.</p><a class="tiny" href="#entrenar">Registrar una sesión →</a>':''}`;}
function body(){const loads=Object.fromEntries(MUSCLES.map(m=>[m.id,muscleLoad(state.sessions,m.id,new Date(),catalog())]));if(!loads[selectedMuscle])selectedMuscle=MUSCLES.reduce((a,m)=>loads[m.id].score>loads[a].score?m.id:a,MUSCLES[0].id);
 const sorted=[...MUSCLES].sort((a,b)=>loads[b.id].score-loads[a.id].score);
 return `<div class="title-row"><div><h1>Lo que has trabajado.</h1><p class="sub">Últimos ${WINDOW_DAYS} días. El color combina la carga de tu última serie con los días que han pasado desde ella.</p></div><a href="#entrenar" class="primary action-link">Registrar entrenamiento ↗</a></div><div class="body-layout"><section class="card body-card"><div class="figures">${figure('front','Frente',loads)}${figure('back','Espalda',loads)}</div><div class="legend" aria-hidden="true">${LEVELS.map((l,i)=>`<span><i class="swatch l${i}"></i>${l}</span>`).join('')}</div><div class="muscle-list" role="group" aria-label="Grupos musculares por intensidad">${sorted.map(m=>`<button class="chip${m.id===selectedMuscle?' selected':''}" data-muscle="${m.id}" aria-pressed="${m.id===selectedMuscle}"><i class="swatch l${loads[m.id].level}" aria-hidden="true"></i>${m.name}</button>`).join('')}</div></section><aside class="card muscle-detail" aria-live="polite">${muscleDetail(selectedMuscle,loads[selectedMuscle])}</aside></div><p class="tiny muted body-note">La intensidad compara cada serie solo con tus propios registros del mismo ejercicio. No mide fatiga ni recuperación.</p>`;}


function addSeries(id){
 const d=draft();d.sets.push({id:uid(),exercise:id,weight:'',reps:''});persist();render();
 const rows=app.querySelectorAll('[data-exercise-card="'+id+'"] [data-field="weight"]');rows[rows.length-1]?.focus();
}
function customExercise(){
 openModal(`<h2>Crear ejercicio personalizado</h2><p>Elige cómo anotar la carga y sus músculos para mantener la misma convención en tus registros.</p><p>Los músculos que marques se usarán como principales en el mapa. Es una asociación manual, no una medición fisiológica.</p>
 <form id="custom-form"><label>Nombre del ejercicio<input id="custom-name" minlength="2" maxlength="60" required placeholder="Ej. press inclinado"></label>
 <label>Cómo anotar la carga<select id="custom-convention">${Object.entries(CONVENTIONS).map(([id,c])=>`<option value="${id}">${c.equipment} · ${c.unit}</option>`).join('')}</select></label>
 <fieldset><legend>Grupos musculares</legend><div class="muscle-options">${MUSCLES.map(m=>`<label class="check-label"><input type="checkbox" name="custom-muscle" value="${m.id}">${m.name}</label>`).join('')}</div></fieldset>
 <p id="custom-error" class="error" role="alert"></p><button class="primary">Crear y añadir a la sesión</button></form>`);
 document.querySelector('#custom-form').onsubmit=ev=>{
  ev.preventDefault();
  try{
   const spec=createExercise({name:document.querySelector('#custom-name').value,convention:document.querySelector('#custom-convention').value,muscles:[...document.querySelectorAll('[name="custom-muscle"]:checked')].map(x=>x.value)},uid(),catalog());
   state.customExercises.push(spec);modal.close();addSeries(spec.id);toast('Ejercicio creado y añadido. Completa la serie antes de guardar.');
  }catch(error){document.querySelector('#custom-error').textContent=error.message;}
 };
}
function cancelSession(){
 const d=draft(),editing=!!d.sessionId;
 openModal(`<h2>${editing?'Salir de la corrección':'Cancelar sesión'}</h2><p>${editing?'La sesión del historial conserva sus valores originales hasta que guardes la corrección.':'Tu sesión todavía no está en el historial.'} Puedes conservar el borrador para retomarlo o descartarlo.</p>
 <div class="dialog-actions"><button class="outline" id="keep-draft">Salir y conservar borrador</button><button class="secondary" id="discard-draft">Descartar borrador</button></div>`);
 document.querySelector('#keep-draft').onclick=()=>{persist();modal.close();go(editing?'historial':'cuerpo');};
 document.querySelector('#discard-draft').onclick=()=>{snapshot();if(editing)state.editDraft=null;else state.draft=null;persist();modal.close();go(editing?'historial':'cuerpo');render();toast('Borrador descartado. Puedes deshacerlo.',true);};
}
function finish(ev){
 ev.preventDefault();const d=draft(),errors=validateDraft(d,catalog());
 if(errors.length){syncStatus();document.querySelector('#session-error').textContent=errors[0].message;return;}
 const editing=!!d.sessionId;
 try{
  snapshot();state=saveSession(state,d,uid(),catalog());
  const saved=persist();historyType='';historyMuscle='';go('historial');render();
  toast(saved?(editing?'Corrección guardada. Historial y evolución actualizados.':'Sesión guardada en el historial.'):'Sesión disponible solo en esta pestaña: no se pudo guardar en el navegador.',true);
 }catch(error){document.querySelector('#session-error').textContent=error.message;}
}
function render(){
 if(!['cuerpo','entrenar','historial','progreso'].includes(view))view='cuerpo';
 app.innerHTML=view==='cuerpo'?body():view==='entrenar'?training():view==='historial'?history():progress();
 document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===view);a.setAttribute('aria-current',a.dataset.nav===view?'page':'false');});bind();
}
function bind(){
 app.querySelectorAll('[data-muscle]').forEach(el=>{
  const pick=()=>{const where=el.closest('.figures')?'.figures':'.muscle-list';selectedMuscle=el.dataset.muscle;render();app.querySelector(where+' [data-muscle="'+selectedMuscle+'"]')?.focus({preventScroll:true});if(matchMedia('(max-width:1100px)').matches)app.querySelector('.muscle-detail').scrollIntoView({behavior:'smooth',block:'nearest'});};
  el.addEventListener('click',pick);if(el.tagName!=='BUTTON')el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();pick();}});
 });
 app.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',()=>{const row=draft().sets.find(s=>s.id===el.closest('[data-set]').dataset.set);row[el.dataset.field]=el.value;persist();syncStatus();}));
 const field=(id,key)=>document.querySelector('#'+id)?.addEventListener('input',ev=>{draft()[key]=ev.target.value;persist();syncStatus();});
 field('session-note','note');field('session-tag','tag');field('session-date','date');
 document.querySelector('#session-type')?.addEventListener('change',ev=>{draft().type=ev.target.value;persist();});
 document.querySelector('#references-reviewed')?.addEventListener('change',ev=>{draft().reviewed=ev.target.checked;persist();syncStatus();document.querySelector('#review-status').textContent=ev.target.checked?'La sesión quedará etiquetada como referencias revisadas. Tus cargas no cambian.':'Sin marcar: la sesión se puede guardar igualmente.';});
 document.querySelector('#exercise-select')?.addEventListener('change',ev=>{selectedExercise=ev.target.value;render();});
 document.querySelector('#history-type')?.addEventListener('change',ev=>{historyType=ev.target.value;render();document.querySelector('#history-type').focus();});
 document.querySelector('#history-muscle')?.addEventListener('change',ev=>{historyMuscle=ev.target.value;render();document.querySelector('#history-muscle').focus();});
 document.querySelector('#exercise-search')?.addEventListener('input',ev=>{
  const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es'),query=norm(ev.target.value),matches=catalog().filter(e=>norm(e.name+' '+e.equipment).includes(query));
  document.querySelector('#add-exercise').innerHTML=matches.map(e=>`<option value="${e.id}">${esc(e.name)} · ${e.equipment}</option>`).join('');
  document.querySelector('[data-action="add-exercise"]').disabled=!matches.length;
  document.querySelector('#search-status').textContent=matches.length?matches.length+' ejercicios disponibles':'No hay coincidencias. Puedes crear tu propio ejercicio.';
 });
 document.querySelector('#session-form')?.addEventListener('submit',finish);
 app.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
  const action=b.dataset.action;
  if(action==='custom')return customExercise();
  if(action==='cancel')return cancelSession();
  if(action==='clear-filters'){historyType='';historyMuscle='';render();return;}
  if(action==='edit-session'){
   const s=state.sessions.find(x=>x.id===b.dataset.session);
   if(state.editDraft&&state.editDraft.sessionId!==s.id){
    openModal('<h2>Tienes una corrección sin terminar</h2><p>Retoma esa corrección y guárdala o descártala antes de abrir otra.</p><button class="primary" id="resume-edit">Retomar corrección</button>');
    document.querySelector('#resume-edit').onclick=()=>{modal.close();go('entrenar');};return;
   }
   state.editDraft??={...structuredClone(s),sessionId:s.id,type:s.type||'Automático'};persist();go('entrenar');return;
  }
  if(action==='add-exercise'){const id=document.querySelector('#add-exercise').value;if(findExercise(id,catalog()))addSeries(id);return;}
  if(action==='add-series')return addSeries(b.dataset.exercise);
  const d=draft();
  if(action==='today'){d.date=localDate();persist();render();}
  if(action==='remove'){snapshot();d.sets=d.sets.filter(s=>s.id!==b.dataset.id);persist();render();toast('Serie retirada. Puedes deshacerlo.',true);}
  if(action==='clear-legacy'){snapshot();d.sets=d.sets.filter(s=>s.done);d.legacy=false;persist();render();toast('Series no confirmadas retiradas.',true);}
 });
}
document.querySelector('#close-modal').onclick=()=>modal.close();
document.querySelector('#reset').onclick=()=>{
 openModal('<h2>Restablecer los ejemplos</h2><p>Se retirarán las sesiones, los ejercicios personalizados y los borradores de este navegador, y se cargarán seis sesiones de ejemplo. Después podrás deshacer esta acción.</p><button id="confirm-reset" class="primary">Restablecer datos</button>');
 document.querySelector('#confirm-reset').onclick=()=>{snapshot();state=migrateState(null);persist();modal.close();render();toast('Ejemplos restablecidos',true);};
};
window.addEventListener('hashchange',()=>{view=location.hash.slice(1);render();window.scrollTo(0,0);});
render();persist();
