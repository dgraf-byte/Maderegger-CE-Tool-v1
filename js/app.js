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
function renderNorms(){const p=activeProject(state);const machine=machines.find(m=>m.id===p?.machineType);const ids=machine?.normen||['EN ISO 12100'];qs('#normList').innerHTML=ids.map(id=>{const n=norms.find(x=>x.id===id);return `<div class="norm-item"><strong>${escapeHtml(id)}</strong>${n?`<div class="muted">Typ ${escapeHtml(n.type)} · ${escapeHtml(n.title)}</div>`:''}</div>`}).join('')}
window.addEventListener('error',e=>{console.error(e.error||e.message)});
