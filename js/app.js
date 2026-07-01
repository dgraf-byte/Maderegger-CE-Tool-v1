const machineTypes=[
 {id:'foerderband',name:'Förderband',norms:['EN ISO 12100','EN 619','EN 60204-1','EN ISO 13849-1','EN ISO 13850','EN ISO 13857','EN ISO 14120','EN ISO 14119']},
 {id:'rollenbahn',name:'Rollenbahn',norms:['EN ISO 12100','EN 619','EN 60204-1','EN ISO 13850','EN ISO 13857','EN ISO 14120']},
 {id:'schneckenfoerderer',name:'Schneckenförderer',norms:['EN ISO 12100','EN 618','EN 60204-1','EN ISO 13849-1','EN ISO 13857','EN ISO 14120']},
 {id:'portalmix',name:'Portal-Mix',norms:['EN ISO 12100','EN 60204-1','EN ISO 13849-1','EN ISO 13850','EN ISO 13857','EN ISO 14120','EN ISO 14119']},
 {id:'stahlscharnier',name:'Stahlscharnierförderer',norms:['EN ISO 12100','EN 619','EN 60204-1','EN ISO 13849-1','EN ISO 13857','EN ISO 14120']},
 {id:'vibrorinne',name:'Vibrorinne',norms:['EN ISO 12100','EN 618','EN 60204-1','EN ISO 13850','EN ISO 13857']},
 {id:'sondermaschine',name:'Sondermaschine',norms:['EN ISO 12100','EN 60204-1','EN ISO 13849-1','EN ISO 13850','EN ISO 13857','EN ISO 14120','EN ISO 14119']}
];
const normDescriptions={
 'EN ISO 12100':'Allgemeine Gestaltungsleitsätze, Risikobeurteilung und Risikominderung',
 'EN 619':'Stetigförderer und Systeme für Stückgut',
 'EN 620':'Stetigförderer und Systeme für Schüttgut, stationäre Gurtförderer',
 'EN 618':'Stetigförderer und Systeme für Schüttgut, ausgenommen stationäre Gurtförderer',
 'EN 60204-1':'Elektrische Ausrüstung von Maschinen',
 'EN ISO 13849-1':'Sicherheitsbezogene Teile von Steuerungen',
 'EN ISO 13850':'Not-Halt-Funktion',
 'EN ISO 13857':'Sicherheitsabstände',
 'EN ISO 14120':'Trennende Schutzeinrichtungen',
 'EN ISO 14119':'Verriegelungseinrichtungen'
};
const equipment=['Frequenzumrichter','Pneumatik','Hydraulik','Servoantrieb','Sicherheitssteuerung','Lichtgitter','Schutzzäune','Schutztüren','Verriegelungen','Hubachsen'];
const lifePhases=['Transport','Montage','Inbetriebnahme','Automatikbetrieb','Handbetrieb','Einrichten','Reinigung','Wartung','Störung','Demontage'];
const fallbackHazards=[
 {id:'FB-M-Q-001',maschinen:['foerderband'],gruppe:'Mechanische Gefährdungen',untergruppe:'Quetschen',bereich:'Antrieb',frage:'Besteht eine Quetschstelle zwischen Fördergurt und Antriebstrommel?',normen:['EN ISO 12100','EN 619'],standardMassnahmen:['Schutzhaube am Antrieb vorsehen','Sicherheitsabstände prüfen','Reinigung und Wartung nur bei Stillstand zulassen']}
];

let hazards=[];
let riskFilter='all';
let treeFilter={group:null,sub:null};
let currentProject={equipment:[],lifePhases:[],risks:{},machineType:'foerderband'};
let projects=JSON.parse(localStorage.getItem('mce_projects')||'[]');
const $=s=>document.querySelector(s);
const $all=s=>Array.from(document.querySelectorAll(s));

async function init(){
  setupNav();
  renderSelects();
  renderChecks();
  bindEvents();
  await loadHazards();
  fillForm(currentProject);
  renderAll();
}
function setupNav(){ $all('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view))); }
function showView(view){
  $all('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $all('.view').forEach(v=>v.classList.toggle('active',v.id===view));
  const nav=document.querySelector(`[data-view="${view}"]`);
  $('#pageTitle').textContent=nav?nav.textContent:'Dashboard';
  if(view==='risk')renderRisks();
  if(view==='norms')renderNorms();
}
function renderSelects(){ $('#machineTypeSelect').innerHTML='<option value="">Bitte wählen</option>'+machineTypes.map(m=>`<option value="${m.id}">${m.name}</option>`).join(''); }
function renderChecks(){
  $('#equipmentList').innerHTML=equipment.map(x=>`<label class="check-item"><input type="checkbox" name="equipment" value="${esc(x)}">${esc(x)}</label>`).join('');
  $('#lifePhaseList').innerHTML=lifePhases.map(x=>`<label class="check-item"><input type="checkbox" name="lifePhases" value="${esc(x)}">${esc(x)}</label>`).join('');
}
function bindEvents(){
  $('#newProjectBtn')?.addEventListener('click',newProject);
  $('#saveProjectBtn')?.addEventListener('click',saveProject);
  $('#saveProjectBottomBtn')?.addEventListener('click',saveProject);
  $('#saveRiskBottomBtn')?.addEventListener('click',saveProject);
  $('#machineTypeSelect')?.addEventListener('change',()=>{updateFromForm(); treeFilter={group:null,sub:null}; renderAll();});
  $('#showAllRiskBtn')?.addEventListener('click',()=>{riskFilter='all';renderRisks();});
  $('#showOpenRiskBtn')?.addEventListener('click',()=>{riskFilter='open';renderRisks();});
  $('#showYesRiskBtn')?.addEventListener('click',()=>{riskFilter='yes';renderRisks();});
  $('#exportJsonBtn')?.addEventListener('click',exportJson);
  $('#exportCsvBtn')?.addEventListener('click',exportCsv);
  $('#exportWordBtn')?.addEventListener('click',exportWord);
  $('#printReportBtn')?.addEventListener('click',()=>window.print());
}
async function loadHazards(){
  try{
    const res=await fetch('data/gefahren.json',{cache:'no-store'});
    if(!res.ok) throw new Error('gefahren.json nicht gefunden');
    hazards=await res.json();
  }catch(e){ hazards=fallbackHazards; }
}
function renderAll(){ renderDashboard(); renderNorms(); renderRisks(); }
function getMachine(){ return machineTypes.find(m=>m.id===currentProject.machineType)||machineTypes[0]; }
function getRelevantHazards(){
  const mt=currentProject.machineType||'foerderband';
  return hazards.filter(h=>!h.maschinen || h.maschinen.includes(mt));
}
function fillForm(project){
  currentProject={equipment:[],lifePhases:[],risks:{},machineType:'foerderband',...project};
  const form=$('#projectForm');
  if(form){
    Object.entries(currentProject).forEach(([k,v])=>{ const el=form.elements[k]; if(el && !['equipment','lifePhases'].includes(k)) el.value=v??''; });
    $all('input[name="equipment"]').forEach(cb=>cb.checked=(currentProject.equipment||[]).includes(cb.value));
    $all('input[name="lifePhases"]').forEach(cb=>cb.checked=(currentProject.lifePhases||[]).includes(cb.value));
  }
  renderAll();
}
function updateFromForm(){
  const form=$('#projectForm');
  if(!form)return;
  const data=new FormData(form);
  for(const [k,v] of data.entries()){ if(!['equipment','lifePhases'].includes(k)) currentProject[k]=v; }
  currentProject.equipment=$all('input[name="equipment"]:checked').map(x=>x.value);
  currentProject.lifePhases=$all('input[name="lifePhases"]:checked').map(x=>x.value);
}
function renderDashboard(){
  const relevant=getRelevantHazards();
  const answered=relevant.filter(h=>currentProject.risks?.[h.id]?.answer).length;
  const yes=relevant.filter(h=>currentProject.risks?.[h.id]?.answer==='yes').length;
  const base=['projectNo','projectName','customer','machineType','machineName'].filter(k=>currentProject[k]).length;
  const progress=Math.round(((base/5)*40)+((relevant.length?answered/relevant.length:0)*60));
  $('#dashProject').textContent=currentProject.projectName||currentProject.machineName||'Kein Projekt gewählt';
  $('#dashCustomer').textContent=currentProject.customer||'Bitte Projektdaten erfassen.';
  $('#dashProgress').textContent=progress+'%';
  $('#progressBar').style.width=progress+'%';
  $('#dashRisk').textContent=`${answered} / ${relevant.length}`;
  $('#dashRiskInfo').textContent=`${yes} Gefährdungen mit „Ja“ bewertet.`;
  renderProjectList();
  updateRiskSummary();
}
function renderProjectList(){
  if(!projects.length){ $('#projectList').innerHTML='<div class="empty">Noch keine gespeicherten Projekte.</div>'; return; }
  $('#projectList').innerHTML=projects.map((p,i)=>`<div class="project-item"><div><strong>${esc(p.projectNo||'ohne Nr.')} – ${esc(p.projectName||p.machineName||'Projekt')}</strong><br><span class="muted">${esc(p.customer||'')}</span></div><div class="top-actions"><button class="btn small" onclick="loadProject(${i})">Öffnen</button><button class="btn small" onclick="deleteProject(${i})">Löschen</button></div></div>`).join('');
}
function renderNorms(){ const m=getMachine(); $('#normList').innerHTML=(m.norms||[]).map(n=>`<div class="norm-item"><strong>${esc(n)}</strong><br><span>${esc(normDescriptions[n]||'')}</span></div>`).join(''); }

function renderRisks(){
  const list=$('#riskList');
  if(!list)return;
  const allRelevant=getRelevantHazards();
  const treeHtml=renderRiskTree(allRelevant);
  let relevant=allRelevant;
  if(treeFilter.group) relevant=relevant.filter(h=>h.gruppe===treeFilter.group);
  if(treeFilter.sub) relevant=relevant.filter(h=>h.untergruppe===treeFilter.sub);
  if(riskFilter==='open') relevant=relevant.filter(h=>!currentProject.risks?.[h.id]?.answer);
  if(riskFilter==='yes') relevant=relevant.filter(h=>currentProject.risks?.[h.id]?.answer==='yes');
  const title=treeFilter.sub||treeFilter.group||'Alle Gefährdungen';
  const cardsHtml=relevant.length
    ? renderGroupedRiskCards(relevant)
    : '<div class="panel empty">Keine passenden Gefährdungen für den aktuellen Filter.</div>';
  list.innerHTML=`<div class="risk-layout"><aside class="risk-tree panel"><div class="tree-title">Gefährdungsbaum</div>${treeHtml}</aside><section class="risk-workspace"><div class="risk-workspace-head"><h2>${esc(title)}</h2><span>${relevant.length} Fragen</span></div>${cardsHtml}</section></div>`;
  updateRiskSummary();
}
function renderRiskTree(items){
  const groups=groupBy(items,h=>h.gruppe||'Sonstige Gefährdungen');
  return Object.entries(groups).map(([group,groupItems])=>{
    const gs=stats(groupItems);
    const subs=groupBy(groupItems,h=>h.untergruppe||'Allgemein');
    return `<details class="tree-group" open><summary onclick="selectRiskFilter('${attr(group)}','')"><span>${esc(group)}</span><b>${gs.answered}/${gs.total}</b></summary><div class="tree-progress"><span style="width:${gs.percent}%"></span></div><div class="tree-sublist">${Object.entries(subs).map(([sub,subItems])=>{const ss=stats(subItems); const active=treeFilter.group===group&&treeFilter.sub===sub; return `<button type="button" class="tree-sub ${active?'active':''}" onclick="selectRiskFilter('${attr(group)}','${attr(sub)}')"><span>${esc(sub)}</span><small>${ss.answered}/${ss.total} · Ja ${ss.yes}</small><em><i style="width:${ss.percent}%"></i></em></button>`;}).join('')}</div></details>`;
  }).join('')+`<button type="button" class="tree-clear ${!treeFilter.group?'active':''}" onclick="selectRiskFilter('','')">Alle Gefährdungen anzeigen</button>`;
}
function renderGroupedRiskCards(items){
  const groups=groupBy(items,h=>`${h.gruppe} – ${h.untergruppe}`);
  return Object.entries(groups).map(([g,arr])=>`<div class="risk-group"><h2>${esc(g)}</h2><span class="muted">${arr.length} Fragen</span></div>${arr.map(renderRiskCard).join('')}`).join('');
}
function stats(items){
  const total=items.length;
  const answered=items.filter(h=>currentProject.risks?.[h.id]?.answer).length;
  const yes=items.filter(h=>currentProject.risks?.[h.id]?.answer==='yes').length;
  return {total,answered,yes,open:total-answered,percent:total?Math.round(answered/total*100):0};
}
function selectRiskFilter(group,sub){ treeFilter={group:group||null,sub:sub||null}; renderRisks(); }

function renderRiskCard(h){
  const r=currentProject.risks?.[h.id]||{};
  const yes=r.answer==='yes', no=r.answer==='no';
  const score=getRiskScore(r);
  return `<article class="risk-card ${yes?'yes':''} ${no?'no':''}" data-id="${h.id}"><div class="risk-top"><div class="risk-title"><strong>${esc(h.frage)}</strong><div class="risk-meta"><span class="pill green">${esc(h.id)}</span><span class="pill">${esc(h.bereich||'')}</span><span class="pill">${esc((h.normen||[]).join(' · '))}</span></div></div><div class="choice"><button type="button" class="${yes?'active-yes':''}" onclick="setRiskAnswer('${h.id}','yes')">Ja</button><button type="button" class="${no?'active-no':''}" onclick="setRiskAnswer('${h.id}','no')">Nein</button></div></div><div class="risk-detail"><label class="full">Beschreibung / Situation<textarea oninput="setRiskField('${h.id}','description',this.value)">${esc(r.description||'')}</textarea></label><label>Lebensphase<select onchange="setRiskField('${h.id}','lifePhase',this.value)"><option value="">Bitte wählen</option>${lifePhases.map(p=>`<option value="${p}" ${r.lifePhase===p?'selected':''}>${p}</option>`).join('')}</select></label><label>Ort / Bauteil<input value="${attr(r.location||h.bereich||'')}" oninput="setRiskField('${h.id}','location',this.value)"></label><div class="score-row full"><label>Schwere S<select onchange="setRiskField('${h.id}','S',this.value)">${scoreOptions(['1 - leichte Verletzung','2 - schwere Verletzung'],r.S)}</select></label><label>Häufigkeit F<select onchange="setRiskField('${h.id}','F',this.value)">${scoreOptions(['1 - selten/kurzzeitig','2 - häufig/langzeitig'],r.F)}</select></label><label>Vermeidbarkeit P<select onchange="setRiskField('${h.id}','P',this.value)">${scoreOptions(['1 - möglich','2 - kaum möglich'],r.P)}</select></label></div><label class="full">Maßnahmen<textarea oninput="setRiskField('${h.id}','measures',this.value)">${esc(r.measures||((h.standardMassnahmen||[]).join('\n')))}</textarea></label><label class="full">Restrisiko / Hinweis<textarea oninput="setRiskField('${h.id}','residualRisk',this.value)">${esc(r.residualRisk||'Restrisiko nach Umsetzung der Maßnahmen bewerten und in der Betriebsanleitung beschreiben.')}</textarea></label><div class="risk-result ${score.className}">${score.text}</div></div></article>`;
}
function scoreOptions(opts,val){ return '<option value="">Bitte wählen</option>'+opts.map((o,i)=>`<option value="${i+1}" ${String(val)===String(i+1)?'selected':''}>${o}</option>`).join(''); }
function setRiskAnswer(id,answer){ currentProject.risks=currentProject.risks||{}; currentProject.risks[id]=currentProject.risks[id]||{}; currentProject.risks[id].answer=answer; renderRisks(); renderDashboard(); }
function setRiskField(id,field,value){ currentProject.risks=currentProject.risks||{}; currentProject.risks[id]=currentProject.risks[id]||{answer:'yes'}; currentProject.risks[id][field]=value; updateRiskCardResult(id); renderDashboard(); }
function updateRiskCardResult(id){ const card=document.querySelector(`.risk-card[data-id="${id}"]`); if(!card)return; const res=card.querySelector('.risk-result'); const score=getRiskScore(currentProject.risks[id]||{}); res.className='risk-result '+score.className; res.textContent=score.text; }
function getRiskScore(r){ const s=Number(r.S||0),f=Number(r.F||0),p=Number(r.P||0); if(!s||!f||!p)return{value:0,className:'medium',text:'Risikowert: noch nicht vollständig bewertet'}; const v=s*f*p; if(v<=2)return{value:v,className:'low',text:`Risikowert ${v}: niedrig`}; if(v<=4)return{value:v,className:'medium',text:`Risikowert ${v}: mittel`}; return{value:v,className:'high',text:`Risikowert ${v}: hoch`}; }
function updateRiskSummary(){ const relevant=getRelevantHazards(); const answered=relevant.filter(h=>currentProject.risks?.[h.id]?.answer).length; const yes=relevant.filter(h=>currentProject.risks?.[h.id]?.answer==='yes').length; if($('#riskAnswered'))$('#riskAnswered').textContent=`${answered} / ${relevant.length} beantwortet`; if($('#riskYesCount'))$('#riskYesCount').textContent=`${yes} Gefährdungen vorhanden`; }
function saveProject(){ updateFromForm(); if(!currentProject.projectNo) currentProject.projectNo=autoProjectNo(); const idx=projects.findIndex(p=>p.projectNo&&p.projectNo===currentProject.projectNo); if(idx>=0)projects[idx]=currentProject; else projects.unshift(currentProject); localStorage.setItem('mce_projects',JSON.stringify(projects)); fillForm(currentProject); alert('Gespeichert.'); }
function autoProjectNo(){ return new Date().getFullYear()+'-'+String(projects.length+1).padStart(3,'0'); }
function newProject(){ fillForm({equipment:[],lifePhases:[],risks:{},machineType:'foerderband',projectNo:autoProjectNo()}); showView('project'); }
function loadProject(i){ fillForm(projects[i]); showView('project'); }
function deleteProject(i){ if(confirm('Projekt wirklich löschen?')){projects.splice(i,1); localStorage.setItem('mce_projects',JSON.stringify(projects)); renderDashboard();} }
function getRows(){ return getRelevantHazards().map(h=>{ const r=currentProject.risks?.[h.id]||{}; const sc=getRiskScore(r); return [h.id,h.gruppe,h.untergruppe,h.bereich,h.frage,r.answer||'',(h.normen||[]).join(' | '),r.lifePhase||'',r.location||'',r.S||'',r.F||'',r.P||'',sc.value||'',r.description||'',r.measures||((h.standardMassnahmen||[]).join(' / ')),r.residualRisk||'']; }); }
function exportJson(){ updateFromForm(); download((currentProject.projectNo||'projekt')+'_ce_suite.json',JSON.stringify(currentProject,null,2),'application/json'); }
function exportCsv(){ updateFromForm(); const header=['ID','Gruppe','Untergruppe','Bereich','Frage','Antwort','Normen','Lebensphase','Ort','S','F','P','Risiko','Beschreibung','Maßnahmen','Restrisiko']; const csv=[header,...getRows()].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'); download((currentProject.projectNo||'projekt')+'_risikoanalyse.csv','\ufeff'+csv,'text/csv;charset=utf-8'); }
function exportWord(){ updateFromForm(); const yesRows=getRows().filter(r=>r[5]==='yes'); const html=`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%;font-size:10pt}td,th{border:1px solid #999;padding:6px;vertical-align:top}th{background:#60993B;color:white}</style></head><body><h1>Risikoanalyse</h1><p><b>Projekt:</b> ${esc(currentProject.projectNo||'')} ${esc(currentProject.projectName||'')}</p><p><b>Kunde:</b> ${esc(currentProject.customer||'')}</p><table><tr><th>ID</th><th>Gefährdung</th><th>Frage</th><th>S/F/P</th><th>Maßnahmen</th><th>Restrisiko</th></tr>${yesRows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[2])}</td><td>${esc(r[4])}</td><td>${esc([r[9],r[10],r[11]].filter(Boolean).join('/'))}</td><td>${esc(r[14])}</td><td>${esc(r[15])}</td></tr>`).join('')}</table></body></html>`; download((currentProject.projectNo||'projekt')+'_risikoanalyse.doc',html,'application/msword'); }
function download(name,content,type){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function groupBy(arr,fn){return arr.reduce((a,x)=>{const k=fn(x)||'Sonstige';(a[k] ||= []).push(x);return a;},{});} 
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function attr(s){return esc(s).replace(/`/g,'&#96;');}
window.setRiskAnswer=setRiskAnswer; window.setRiskField=setRiskField; window.loadProject=loadProject; window.deleteProject=deleteProject; window.selectRiskFilter=selectRiskFilter; document.addEventListener('DOMContentLoaded',init);
