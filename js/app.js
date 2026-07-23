import{loadState,saveState,activeProject}from'./storage.js';
import{initNavigation,showView}from'./navigation.js';
import{initProject,renderProjectList}from'./project.js';
import{renderDashboard}from'./dashboard.js';
import{initRisk,renderRisk}from'./risk.js';
import{initExport}from'./export.js';
import{qs,escapeHtml}from'./ui.js';

let state=loadState();
let machines=[];let norms=[];let dangers=[];let lifePhases=[];let components=[];
let navigationInitialized=false;

function safeNavigation(){
  if(navigationInitialized)return;
  try{initNavigation(onView);navigationInitialized=true;}catch(error){console.warn('Hauptnavigation verwendet Notfallmodus.',error)}
}
safeNavigation();

async function readJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`${url} konnte nicht geladen werden (${response.status})`);
  const data=await response.json();
  if(!Array.isArray(data))throw new Error(`${url} enthält kein gültiges Datenfeld.`);
  return data;
}

async function boot(){
  [machines,norms,dangers,lifePhases,components]=await Promise.all([
    readJson('data/maschinen.json'),readJson('data/normen.json'),readJson('data/gefahren.json'),
    readJson('data/lebensphasen.json'),readJson('data/components.json')
  ]);
  initProject({state,machines,lifePhases,onChange:changed,onOpen:view=>showView(view,onView)});
  initRisk({state,dangers,components,onChange:changed});
  initExport(state,dangers,components);
  renderAll();
  document.documentElement.dataset.appReady='true';
  document.querySelector('#ce-start-warning')?.remove();
}
function renderAll(){
  renderDashboard(state,dangers);
  renderProjectList(state,view=>showView(view,onView));
  renderNorms();renderResidualRisks();
}
function changed(options={}){saveState(state);renderAll();if(!options.silent)renderRisk()}
function onView(view){
  try{
    if(view==='dashboard'&&dangers.length)renderDashboard(state,dangers);
    if(view==='risk'&&dangers.length)renderRisk();
    if(view==='norms'&&norms.length)renderNorms();
    if(view==='documents'&&dangers.length)renderResidualRisks();
  }catch(error){showBootError(error)}
}
function renderNorms(){
  const host=qs('#normList');if(!host)return;
  const p=activeProject(state);const machine=machines.find(m=>m.id===p?.machineType);
  let ids=machine?.normen||['EN ISO 12100'];
  if(p?.machineType==='sondermaschine')ids=[...new Set([...ids,...dangers.flatMap(item=>item.normen||[])])];
  const grouped={A:[],B:[],C:[],Weitere:[]};
  ids.forEach(id=>{const n=norms.find(x=>x.id===id);const key=n?.type==='A'?'A':n?.type==='B'?'B':n?.type==='C'?'C':'Weitere';grouped[key].push({id,n})});
  const labels={A:'A-Normen – Grundnormen',B:'B-Normen – Sicherheitsfachgrundnormen',C:'C-Normen – maschinenspezifische Normen',Weitere:'Weitere Normen / Referenzen'};
  host.innerHTML=Object.entries(grouped).filter(([,list])=>list.length).map(([key,list])=>`<section class="norm-group"><h3>${labels[key]}</h3><div class="norm-group-items">${list.map(({id,n})=>`<div class="norm-item"><strong>${escapeHtml(id)}</strong>${n?`<div class="muted">Typ ${escapeHtml(n.type)} · ${escapeHtml(n.title)}</div>`:''}</div>`).join('')}</div></section>`).join('');
}
function renderResidualRisks(){
  const p=activeProject(state);const host=qs('#residualRiskList');const status=qs('#exportStatus');if(!host)return;
  if(!p){host.innerHTML='<div class="empty-state">Kein Projekt gewählt.</div>';if(status)status.textContent='';return}
  p.risk??={};
  const rows=dangers.filter(d=>p.risk?.[d.id]?.answer==='yes'&&(p.risk[d.id].residualRisk||'').trim()).map(d=>({d,r:p.risk[d.id]}));
  host.innerHTML=rows.length?rows.map(({d,r})=>`<article class="residual-item"><strong>${escapeHtml(d.id)} · ${escapeHtml(d.frage)}</strong><p>${escapeHtml(r.residualRisk)}</p><small>${escapeHtml(d.gruppe)} › ${escapeHtml(d.untergruppe)}</small></article>`).join(''):'<div class="empty-state">Noch keine Restrisiken dokumentiert.</div>';
  const relevant=dangers.filter(d=>p.machineType==='sondermaschine'||!p.machineType||(Array.isArray(d.maschinen)&&d.maschinen.includes(p.machineType)));
  const incomplete=relevant.filter(d=>{const r=p.risk?.[d.id]||{};return !r.answer||(r.answer==='yes'&&!(r.severity&&r.frequency&&r.possibility&&r.measure&&r.residualSeverity&&r.residualFrequency&&r.residualPossibility))}).length;
  if(status)status.textContent=incomplete?`Export gesperrt: ${incomplete} relevante Bewertungen sind noch unvollständig.`:'Projektprüfung vollständig – Fachbericht kann exportiert werden.';
}
function showBootError(error){
  console.error(error);
  const msg=error?.stack||error?.message||String(error);
  let box=qs('#ce-start-warning');
  if(!box){box=document.createElement('div');box.id='ce-start-warning';box.className='boot-error';qs('.content')?.prepend(box)}
  box.innerHTML=`<strong>Die Anwendung konnte nicht vollständig gestartet werden.</strong><p>Die Navigation bleibt bedienbar.</p><pre id="ce-error-detail">${escapeHtml(msg)}</pre><button type="button" class="btn" id="ce-retry-btn">Erneut laden</button><button type="button" class="btn" id="ce-reset-btn">Lokale Projektdaten zurücksetzen</button>`;
  qs('#ce-retry-btn')?.addEventListener('click',()=>location.reload());
  qs('#ce-reset-btn')?.addEventListener('click',()=>{if(confirm('Lokale Projektdaten dieses Tools wirklich löschen?')){Object.keys(localStorage).filter(k=>k.startsWith('maderegger-ce-suite')).forEach(k=>localStorage.removeItem(k));location.reload()}});
  const detail=qs('#ce-error-detail');if(detail)detail.textContent=msg;
}
window.addEventListener('error',event=>showBootError(event.error||new Error(event.message)));
window.addEventListener('unhandledrejection',event=>showBootError(event.reason instanceof Error?event.reason:new Error(String(event.reason))));
boot().catch(showBootError);
