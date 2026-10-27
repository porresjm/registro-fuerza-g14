import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=['README.md','package.json','render.yaml','dist/index.html','dist/style.css','dist/model.js','dist/app.js','tests/model.test.js','scripts/prepare-source.mjs'];
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const destination=resolve(root,'dist/codigo');
await mkdir(destination,{recursive:true});
for(const file of files){
  const path=resolve(destination,'archivos',file+'.txt');
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,await readFile(resolve(root,file),'utf8'));
}
const options=files.map(file=>'<option value="'+escape(file)+'">'+escape(file)+'</option>').join('');
const page=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Código del proyecto Grupo 14</title><style>body{font:15px Arial,sans-serif;margin:40px auto;max-width:1100px;padding:0 20px;color:#20251f;background:#f6f5ef}h1{font-size:32px}a{color:#a73919}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#fff;padding:24px;border:1px solid #ddd;border-radius:10px;font-size:12px}select{padding:10px;font:inherit}</style></head><body><a href="../">← Volver al prototipo</a><h1>Código del proyecto Grupo 14</h1><p>Consulta los archivos de esta versión. El enlace al repositorio GitHub se entrega junto al informe.</p><label>Archivo <select id="file">${options}</select></label><pre id="code" aria-live="polite">Cargando archivo…</pre><script>const select=document.querySelector('#file');async function show(){const code=document.querySelector('#code');try{const response=await fetch('archivos/'+select.value+'.txt');if(!response.ok)throw new Error();code.textContent=await response.text();}catch{code.textContent='No se pudo cargar el archivo. Intenta actualizar la página.';}}select.onchange=show;show();</script></body></html>`;
await writeFile(resolve(destination,'index.html'),page);
console.log('Sitio listo para publicar desde dist');
