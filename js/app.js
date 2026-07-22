import{loadState,saveState,activeProject}from'./storage.js';
import{initNavigation,showView}from'./navigation.js';
import{initProject,renderProjectList}from'./project.js';
import{renderDashboard}from'./dashboard.js';
import{initRisk,renderRisk}from'./risk.js';
import{initExport}from'./export.js';
import{qs,escapeHtml}from'./ui.js';
const state=loadState();
const [machines,norms,dangers,lifePhases,components]=await Promise.all(['data/maschinen.json','data/normen.json','data/gefahren.json','data/lebensphasen.json','data/components.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${url} konnte nicht geladen werden`);return r.json()}));
function changed(options={}){
  saveState(state);
  renderDashboard(state,dangers);
  renderProjectList(state,view=>showView(view,onView));
  renderNorms();
  renderResidualRisks();
  if(!options.silent)renderRisk();
}
function onView(view){if(view==='dashboard')renderDashboard(state,dangers);if(view==='risk')renderRisk();if(view==='norms')renderNorms();if(view==='documents')renderResidualRisks()}
initNavigation(onView);
initProject({state,machines,lifePhases,onChange:changed,onOpen:view=>showView(view,onView)});
initRisk({state,dangers,components,onChange:changed});
initExport(state,dangers,components);
renderDashboard(state,dangers);renderProjectList(state,view=>showView(view,onView));renderNorms();renderResidualRisks();
function renderNorms(){
  const p=activeProject(state);
  const machine=machines.find(m=>m.id===p?.machineType);
  let ids=machine?.normen||['EN ISO 12100'];
  if(p?.machineType==='sondermaschine'){
    ids=[...new Set([...ids,...dangers.flatMap(item=>item.normen||[])])];
  }
  const grouped={A:[],B:[],C:[],Weitere:[]};
  ids.forEach(id=>{
    const n=norms.find(x=>x.id===id);
    const key=n?.type==='A'?'A':n?.type==='B'?'B':n?.type==='C'?'C':'Weitere';
    grouped[key].push({id,n});
  });
  const labels={A:'A-Normen – Grundnormen',B:'B-Normen – Sicherheitsfachgrundnormen',C:'C-Normen – maschinenspezifische Normen',Weitere:'Weitere Normen / Referenzen'};
  qs('#normList').innerHTML=Object.entries(grouped).filter(([,list])=>list.length).map(([key,list])=>`<section class="norm-group"><h3>${labels[key]}</h3><div class="norm-group-items">${list.map(({id,n})=>`<div class="norm-item"><strong>${escapeHtml(id)}</strong>${n?`<div class="muted">Typ ${escapeHtml(n.type)} · ${escapeHtml(n.title)}</div>`:''}</div>`).join('')}</div></section>`).join('');
}
window.addEventListener('error',e=>{console.error(e.error||e.message)});

function renderResidualRisks(){
  const p=activeProject(state);const host=qs('#residualRiskList');const status=qs('#exportStatus');if(!host)return;
  if(!p){host.innerHTML='<div class="empty-state">Kein Projekt gewählt.</div>';if(status)status.textContent='';return}
  const rows=dangers.filter(d=>p.risk?.[d.id]?.answer==='yes'&&(p.risk[d.id].residualRisk||'').trim()).map(d=>({d,r:p.risk[d.id]}));
  host.innerHTML=rows.length?rows.map(({d,r})=>`<article class="residual-item"><strong>${escapeHtml(d.id)} · ${escapeHtml(d.frage)}</strong><p>${escapeHtml(r.residualRisk)}</p><small>${escapeHtml(d.gruppe)} › ${escapeHtml(d.untergruppe)}</small></article>`).join(''):'<div class="empty-state">Noch keine Restrisiken dokumentiert.</div>';
  const relevant=dangers.filter(d=>p.machineType==='sondermaschine'||!p.machineType||d.maschinen.includes(p.machineType));
  const incomplete=relevant.filter(d=>{const r=p.risk?.[d.id]||{};return !r.answer||(r.answer==='yes'&&!(r.severity&&r.frequency&&r.possibility&&r.measure&&r.residualSeverity&&r.residualFrequency&&r.residualPossibility))}).length;
  if(status)status.textContent=incomplete?`Export gesperrt: ${incomplete} relevante Bewertungen sind noch unvollständig.`:'Projektprüfung vollständig – Fachbericht kann exportiert werden.';
}
