const $=id=>document.getElementById(id), root=document.documentElement;

/* Menú: abierto/cerrado (se recuerda al cambiar de página, si las demás páginas usan la misma clave) */
function menu(v){root.classList.toggle('open',v);try{localStorage.setItem('menuAbierto',v?'1':'0')}catch(e){}}
$('abrir').onclick=()=>menu(true);
$('cerrar').onclick=()=>menu(false);
$('lupa').onclick=()=>{const t=document.querySelector('.top');t.classList.toggle('searching');if(t.classList.contains('searching'))$('q').focus()};

/* Encuestas */
const ico={
 kidney:'<path d="M9 3c-3 0-5 3-5 7s2 7 5 7c2 0 2-2 2-4s0-3 2-3 3-1 3-3-2-4-5-4z"/><path d="M12 15v6"/>',
 scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3.5"/>',
 heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
 pill:'<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-40 12 12)"/><path d="M9.5 9.5l5 5"/>'};
const L=['Muy mal','Mal','Regular','Bien','Muy bien'], E=['😞','😕','😐','🙂','😄'];
const SiNo=['Sí, totalmente','En parte','No'];
const S=[
 {id:'trasplantado',i:'kidney',t:'Satisfacción del usuario trasplantado',d:'Cuéntanos cómo fue tu atención en el centro de nefrología y trasplante.',q:[
  {k:'scale',p:'¿Cómo fue la atención que recibiste?'},
  {k:'scale',p:'¿El personal te explicó con claridad tu tratamiento?'},
  {k:'choice',p:'¿Recibiste las indicaciones de enfermería?',o:['Sí, completas','Sí, pero incompletas','No']},
  {k:'text',p:'¿Qué podemos mejorar? (opcional)'}]},
 {id:'imagenes',i:'scan',t:'Preparación para estudios',d:'¿Las indicaciones para tu estudio fueron claras? Imágenes, ecocardiogramas y más.',q:[
  {k:'scale',p:'¿Qué tan clara fue la información para prepararte?'},
  {k:'choice',p:'¿Pudiste seguir la preparación indicada?',o:SiNo},
  {k:'choice',p:'¿Cómo recibiste las indicaciones?',o:['Con un código QR','Impresas','Me las explicó el personal']},
  {k:'text',p:'¿Qué podemos mejorar? (opcional)'}]},
 {id:'alta',i:'heart',t:'Plan de alta y cuidados',d:'Opina sobre la información que recibiste de enfermería al irte de alta.',q:[
  {k:'scale',p:'¿Cómo fue la información que recibiste al irte de alta?'},
  {k:'choice',p:'¿Entendiste los cuidados que debes seguir en casa?',o:SiNo},
  {k:'choice',p:'¿Sabes a quién consultar si tienes dudas?',o:['Sí','No']},
  {k:'text',p:'¿Qué podemos mejorar? (opcional)'}]},
 {id:'warfarina',i:'pill',t:'Tratamiento con warfarina',d:'¿Entiendes cómo tomar tu medicación y qué cuidados tener?',q:[
  {k:'choice',p:'¿Sabes cómo y a qué hora tomar la warfarina?',o:['Sí','Más o menos','No']},
  {k:'choice',p:'¿Conoces los alimentos y medicamentos que debes cuidar?',o:SiNo},
  {k:'scale',p:'¿Qué tan clara fue la información que recibiste?'},
  {k:'text',p:'¿Qué podemos mejorar? (opcional)'}]}
];
const KEY='encuestas_respuestas';
let sv,st,ans;

function lista(){
  const q=$('q').value.trim().toLowerCase();
  const r=S.map((e,k)=>({...e,k})).filter(e=>(e.t+' '+e.d).toLowerCase().includes(q));
  $('list').innerHTML=r.length?r.map(e=>`<article class="card"><div class="inset"><svg width="24" height="24" viewBox="0 0 24 24">${ico[e.i]}</svg></div><h3>${e.t}</h3><p>${e.d}</p><small>${e.q.length} preguntas · 2 min</small><button class="go" data-k="${e.k}" aria-label="Responder: ${e.t}"><svg width="24" height="24" class="f" viewBox="0 0 24 24"><path d="M3 3l18 9-18 9 3.5-9z"/></svg></button></article>`).join(''):'<p class="empty">No encontramos encuestas con esa búsqueda.</p>';
}
function vista(w){$('list').hidden=$('intro').hidden=w!=='list';$('wiz').hidden=w!=='wiz';scrollTo(0,0)}
function paso(){
  const q=sv.q[st],n=sv.q.length;
  let h=`<button class="back" data-a="back">← ${st?'Anterior':'Volver a las encuestas'}</button><p class="sv">${sv.t}</p><div class="prog"><i style="width:${st/n*100}%"></i></div><small>Pregunta ${st+1} de ${n}</small><p class="qt" id="qt" tabindex="-1">${q.p}</p>`;
  if(q.k==='scale')h+='<div class="opts scale">'+L.map((l,i)=>`<button class="opt${ans[st]===i+1?' sel':''}" data-v="${i+1}"><span class="e">${E[i]}</span>${l}</button>`).join('')+'</div>';
  else if(q.k==='choice')h+='<div class="opts">'+q.o.map(o=>`<button class="opt${ans[st]===o?' sel':''}" data-v="${o}">${o}</button>`).join('')+'</div>';
  else h+='<textarea id="tx" aria-label="Tu comentario" placeholder="Escribe aquí…"></textarea><div class="row"><button class="btn" data-a="skip">Omitir</button><button class="btn p" data-a="send">Enviar respuestas</button></div>';
  $('wiz').innerHTML=h;
  if(q.k==='text')$('tx').value=ans[st]||'';
  $('qt').focus({preventScroll:true});
}
function fin(){
  // Guardado de prueba en el navegador. Cuando esté el servidor, reemplazar por un fetch() a la API.
  try{const r=JSON.parse(localStorage.getItem(KEY)||'[]');r.push({encuesta:sv.id,respuestas:sv.q.map((q,i)=>({pregunta:q.p,respuesta:ans[i]??null})),fecha:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(r))}catch(e){}
  $('wiz').innerHTML='<div class="thanks"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-7"/></svg><h3>¡Gracias por tu opinión!</h3><p class="lead" style="margin:0 auto">Tus respuestas nos ayudan a mejorar la atención.</p><button class="btn p" data-a="back0">Volver a las encuestas</button></div>';
}
$('list').onclick=e=>{const b=e.target.closest('.go');if(!b)return;sv=S[b.dataset.k];st=0;ans=[];vista('wiz');paso()};
$('wiz').onclick=e=>{
  const o=e.target.closest('.opt'),a=e.target.closest('[data-a]')?.dataset.a;
  if(o){const q=sv.q[st];ans[st]=q.k==='scale'?+o.dataset.v:o.dataset.v;st++;st<sv.q.length?paso():fin()}
  else if(a==='back'){st?(st--,paso()):vista('list')}
  else if(a==='back0')vista('list');
  else if(a==='skip'){ans[st]='';fin()}
  else if(a==='send'){ans[st]=$('tx').value.trim();fin()}
};
$('q').oninput=lista;
lista();