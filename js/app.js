import{loadState,saveState,activeProject}from'./storage.js';
import{initNavigation,showView}from'./navigation.js';
import{initProject,renderProjectList}from'./project.js';
import{renderDashboard}from'./dashboard.js';
import{initRisk,renderRisk}from'./risk.js';
import{initExport}from'./export.js';
import{qs,escapeHtml}from'./ui.js';
const state=loadState();
const [machines,norms,dangers,lifePhases]=await Promise.all(['data/maschinen.json','data/normen.json','data/gefahren.json','data/lebensphasen.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${url} konnte nicht geladen werden`);return r.json()}));
function changed(){saveState(state);renderDashboard(state,dangers);renderProjectList(state,view=>showView(view,onView));renderNorms();renderRisk()}
function onView(view){if(view==='dashboard')renderDashboard(state,dangers);if(view==='risk')renderRisk();if(view==='norms')renderNorms()}
initNavigation(onView);
initProject({state,machines,lifePhases,onChange:changed,onOpen:view=>showView(view,onView)});
initRisk({state,dangers,onChange:changed});
initExport(state,dangers);
renderDashboard(state,dangers);renderProjectList(state,view=>showView(view,onView));renderNorms();
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
