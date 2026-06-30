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
const fallbackHazards=[];
let hazards=[];
let currentProject={equipment:[],lifePhases:[],risks:{}};
let projects=JSON.parse(localStorage.getItem('mce_projects')||'[]');
function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}
function clone(x){return JSON.parse(JSON.stringify(x))}
async function init(){setupNav();renderSelects();renderChecks();bindForm();await loadHazards();renderDashboard();renderNorms();renderRisks();}
function setupNav(){ $all('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{ $all('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); $all('.view').forEach(v=>v.classList.remove('active')); $('#'+btn.dataset.view).classList.add('active'); $('#pageTitle').textContent=btn.textContent; if(btn.dataset.view==='risk')renderRisks(); })); }
function renderSelects(){ const sel=$('#machineTypeSelect'); sel.innerHTML='<option value="">Bitte wählen</option>'+machineTypes.map(m=>`<option value="${m.id}">${m.name}</option>`).join(''); }
function renderChecks(){ $('#equipmentList').innerHTML=equipment.map(x=>`<label class="check-item"><input type="checkbox" name="equipment" value="${x}">${x}</label>`).join(''); $('#lifePhaseList').innerHTML=lifePhases.map(x=>`<label class="check-item"><input type="checkbox" name="lifePhases" value="${x}">${x}</label>`).join(''); }
function bindForm(){ const form=$('#projectForm'); form.addEventListener('input',updateFromForm); form.addEventListener('change',updateFromForm); $('#saveProjectBtn').addEventListener('click',saveProject); $('#saveProjectBottomBtn').addEventListener('click',saveProject); $('#saveRiskBottomBtn').addEventListener('click',saveProject); $('#newProjectBtn').addEventListener('click',newProject); $('#exportJsonBtn').addEventListener('click',exportJson); $('#exportCsvBtn').addEventListener('click',exportCsv); $('#exportWordBtn').addEventListener('click',exportWord); $('#printReportBtn').addEventListener('click',()=>window.print()); }
async function loadHazards(){ try{ const res=await fetch('data/gefahren.json',{cache:'no-store'}); hazards=await res.json(); }catch(e){ hazards=fallbackHazards; console.warn('Gefährdungskatalog konnte nicht geladen werden.',e); } }
function updateFromForm(){ const oldRisks=currentProject.risks||{}; const fd=new FormData($('#projectForm')); currentProject=Object.fromEntries(fd.entries()); currentProject.equipment=fd.getAll('equipment'); currentProject.lifePhases=fd.getAll('lifePhases'); currentProject.risks=oldRisks; renderDashboard(); renderNorms(); }
function fillForm(p){ const form=$('#projectForm'); form.reset(); Object.entries(p).forEach(([k,v])=>{ if(Array.isArray(v)||k==='risks')return; const el=form.elements[k]; if(el) el.value=v; }); $all('input[name="equipment"]').forEach(i=>i.checked=(p.equipment||[]).includes(i.value)); $all('input[name="lifePhases"]').forEach(i=>i.checked=(p.lifePhases||[]).includes(i.value)); currentProject=clone({...p,equipment:p.equipment||[],lifePhases:p.lifePhases||[],risks:p.risks||{}}); renderDashboard(); renderNorms(); renderRisks(); }
function getMachine(){ return machineTypes.find(m=>m.id===currentProject.machineType); }
function getRelevantHazards(){ if(!currentProject.machineType)return hazards.filter(h=>(h.maschinen||[]).includes('foerderband')); return hazards.filter(h=>(h.maschinen||[]).includes(currentProject.machineType)); }
function completion(){ let keys=['projectNo','projectName','customer','designer','ceResponsible','machineType','machineName']; let filled=keys.filter(k=>currentProject[k]).length; if((currentProject.lifePhases||[]).length)filled++; if((currentProject.equipment||[]).length)filled++; const relevant=getRelevantHazards(); const answered=relevant.filter(h=>currentProject.risks?.[h.id]?.answer).length; const riskPart=relevant.length?Math.round((answered/relevant.length)*35):0; return Math.min(100,Math.round((filled/(keys.length+2)*65)+riskPart)); }
function renderDashboard(){ const m=getMachine(); $('#dashProject').textContent=currentProject.projectName||currentProject.projectNo||'Kein Projekt gewählt'; $('#dashCustomer').textContent=currentProject.customer||'Bitte Projektdaten erfassen.'; const relevant=getRelevantHazards(); const answered=relevant.filter(h=>currentProject.risks?.[h.id]?.answer).length; const yes=relevant.filter(h=>currentProject.risks?.[h.id]?.answer==='yes').length; $('#dashRisk').textContent=`${answered} / ${relevant.length}`; $('#dashRiskInfo').textContent=`${yes} Gefährdungen vorhanden`; const c=completion(); $('#dashProgress').textContent=c+'%'; $('#progressBar').style.width=c+'%'; renderProjectList(); }
function renderProjectList(){ const box=$('#projectList'); if(!projects.length){box.innerHTML='<p class="muted">Noch keine Projekte gespeichert.</p>';return;} box.innerHTML=projects.map((p,i)=>`<div class="project-item"><strong>${p.projectNo||'ohne Nr.'} – ${p.projectName||'ohne Name'}</strong><br><span>${p.customer||'kein Kunde'} · ${p.machineName||''}</span><br><button class="btn" onclick="loadProject(${i})">Öffnen</button> <button class="btn danger" onclick="deleteProject(${i})">Löschen</button></div>`).join(''); }
function renderNorms(){ const m=getMachine(); const norms=m?m.norms:[]; $('#normList').innerHTML=norms.length?norms.map(n=>`<div class="norm-item"><strong>${n}</strong><span>${normDescriptions[n]||'Beschreibung folgt.'}</span></div>`).join(''):'<p class="muted">Bitte zuerst eine Maschinenart wählen.</p>'; }
function saveProject(){ updateFromForm(); if(!currentProject.projectNo && !currentProject.projectName){alert('Bitte mindestens Projektnummer oder Projektname eintragen.');return;} const id=currentProject.id||Date.now().toString(); currentProject.id=id; const idx=projects.findIndex(p=>p.id===id); if(idx>=0)projects[idx]=clone(currentProject); else projects.unshift(clone(currentProject)); localStorage.setItem('mce_projects',JSON.stringify(projects)); renderDashboard(); alert('Projekt gespeichert.'); }
function newProject(){ currentProject={equipment:[],lifePhases:[],risks:{}}; fillForm(currentProject); document.querySelector('[data-view="project"]').click(); }
function loadProject(i){ fillForm(projects[i]); document.querySelector('[data-view="project"]').click(); }
function deleteProject(i){ if(confirm('Projekt wirklich löschen?')){projects.splice(i,1); localStorage.setItem('mce_projects',JSON.stringify(projects)); renderDashboard();} }
function exportJson(){ updateFromForm(); const blob=new Blob([JSON.stringify(currentProject,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(currentProject.projectNo||'projekt')+'_ce_suite.json'; a.click(); URL.revokeObjectURL(a.href); }

function getReportRows(){ const relevant=getRelevantHazards(); return relevant.map(h=>{ const r=currentProject.risks?.[h.id]||{}; const score=getRiskScore(r); return {id:h.id,gruppe:h.gruppe||'',untergruppe:h.untergruppe||'',bereich:h.bereich||'',frage:h.frage||'',antwort:r.answer||'',normen:(h.normen||[]).join(' | '),lebensphase:r.lifePhase||'',ort:r.location||'',S:r.S||'',F:r.F||'',P:r.P||'',risiko:score.value||'',beschreibung:r.description||'',massnahmen:r.measures||((h.standardMassnahmen||[]).join(' / ')),restrisiko:r.residualRisk||''}; }); }
function csvEscape(v){ v=String(v??''); return '"'+v.replace(/"/g,'""')+'"'; }
function exportCsv(){ updateFromForm(); const rows=getReportRows(); const header=['ID','Gruppe','Untergruppe','Bereich','Frage','Antwort','Normen','Lebensphase','Ort/Bauteil','S','F','P','Risikowert','Beschreibung','Maßnahmen','Restrisiko']; const data=rows.map(r=>[r.id,r.gruppe,r.untergruppe,r.bereich,r.frage,r.antwort,r.normen,r.lebensphase,r.ort,r.S,r.F,r.P,r.risiko,r.beschreibung,r.massnahmen,r.restrisiko]); const csv=[header,...data].map(row=>row.map(csvEscape).join(';')).join('\n'); downloadFile((currentProject.projectNo||'projekt')+'_risikoanalyse.csv', '\ufeff'+csv, 'text/csv;charset=utf-8'); }
function exportWord(){ updateFromForm(); const rows=getReportRows().filter(r=>r.antwort==='yes'); const norms=(getMachine()?.norms||[]).map(n=>`<li><strong>${escapeHtml(n)}</strong> – ${escapeHtml(normDescriptions[n]||'')}</li>`).join(''); const riskRows=rows.map(r=>`<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.untergruppe)}</td><td>${escapeHtml(r.bereich)}</td><td>${escapeHtml(r.frage)}</td><td>${escapeHtml(r.normen)}</td><td>${escapeHtml([r.S,r.F,r.P].filter(Boolean).join('/'))}</td><td>${escapeHtml(String(r.risiko||''))}</td><td>${nl2br(r.massnahmen)}</td><td>${nl2br(r.restrisiko)}</td></tr>`).join(''); const html=`<!doctype html><html><head><meta charset="utf-8"><title>Risikoanalyse</title><style>body{font-family:Arial,sans-serif;color:#202426}h1{color:#2F3234}h2{color:#60993B;border-bottom:2px solid #60993B;padding-bottom:4px}table{border-collapse:collapse;width:100%;font-size:10pt}td,th{border:1px solid #999;padding:6px;vertical-align:top}th{background:#60993B;color:white}.meta td:first-child{font-weight:bold;width:190px}</style></head><body><h1>Risikoanalyse / Konformitätsbewertung</h1><h2>Projektdaten</h2><table class="meta"><tr><td>Projekt-Nr.</td><td>${escapeHtml(currentProject.projectNo||'')}</td></tr><tr><td>Projektname</td><td>${escapeHtml(currentProject.projectName||'')}</td></tr><tr><td>Kunde</td><td>${escapeHtml(currentProject.customer||'')}</td></tr><tr><td>Maschine</td><td>${escapeHtml(currentProject.machineName||'')}</td></tr><tr><td>Maschinenart</td><td>${escapeHtml(getMachine()?.name||'')}</td></tr><tr><td>CE-Verantwortlicher</td><td>${escapeHtml(currentProject.ceResponsible||'')}</td></tr></table><h2>Angewandte / vorgeschlagene Normen</h2><ul>${norms}</ul><h2>Bewertete Gefährdungen</h2><table><thead><tr><th>ID</th><th>Gefährdung</th><th>Bereich</th><th>Frage</th><th>Normen</th><th>S/F/P</th><th>Risiko</th><th>Maßnahmen</th><th>Restrisiko</th></tr></thead><tbody>${riskRows||'<tr><td colspan="9">Keine vorhandenen Gefährdungen bewertet.</td></tr>'}</tbody></table><p><br><br>Datum / Unterschrift: ______________________________</p></body></html>`; downloadFile((currentProject.projectNo||'projekt')+'_risikoanalyse.doc', html, 'application/msword'); }
function nl2br(v){ return escapeHtml(v||'').replace(/\n/g,'<br>'); }
function downloadFile(filename, content, type){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

function renderRisks(){ const list=$('#riskList'); if(!list)return; const relevant=getRelevantHazards(); if(!hazards.length){ list.innerHTML='<div class="panel"><p class="muted">Gefährdungskatalog konnte nicht geladen werden. Prüfe, ob data/gefahren.json hochgeladen wurde.</p></div>'; return; } if(!relevant.length){ list.innerHTML='<div class="panel"><p class="muted">Für diese Maschinenart sind noch keine Gefährdungen hinterlegt.</p></div>'; return; } const grouped=groupBy(relevant,h=>h.untergruppe); list.innerHTML=Object.entries(grouped).map(([group,items])=>`<div class="panel"><h2>${group}</h2><p class="muted">${items.length} Fragen</p></div>${items.map(renderRiskCard).join('')}`).join(''); updateRiskSummary(); }
function renderRiskCard(h){ const r=currentProject.risks?.[h.id]||{}; const yes=r.answer==='yes'; const no=r.answer==='no'; const score=getRiskScore(r); return `<article class="risk-card ${yes?'yes':''} ${no?'no':''}" data-id="${h.id}">
  <div class="risk-top">
    <div class="risk-title">
      <strong>${h.frage}</strong>
      <div class="risk-meta"><span class="pill green">${h.id}</span><span class="pill">${h.bereich}</span><span class="pill">${(h.normen||[]).join(' · ')}</span></div>
    </div>
    <div class="choice"><button type="button" class="${yes?'active-yes':''}" onclick="setRiskAnswer('${h.id}','yes')">Ja</button><button type="button" class="${no?'active-no':''}" onclick="setRiskAnswer('${h.id}','no')">Nein</button></div>
  </div>
  <div class="risk-detail">
    <label class="full">Beschreibung / Situation<textarea oninput="setRiskField('${h.id}','description',this.value)">${escapeHtml(r.description||'')}</textarea></label>
    <label>Lebensphase<select onchange="setRiskField('${h.id}','lifePhase',this.value)">${lifePhases.map(p=>`<option ${r.lifePhase===p?'selected':''}>${p}</option>`).join('')}</select></label>
    <label>Ort / Bauteil<input value="${escapeAttr(r.location||h.bereich||'')}" oninput="setRiskField('${h.id}','location',this.value)"></label>
    <div class="score-row full">
      <label>Schwere S<select onchange="setRiskField('${h.id}','S',this.value)">${scoreOptions(['1 - leichte Verletzung','2 - schwere Verletzung'],r.S)}</select></label>
      <label>Häufigkeit F<select onchange="setRiskField('${h.id}','F',this.value)">${scoreOptions(['1 - selten/kurzzeitig','2 - häufig/langzeitig'],r.F)}</select></label>
      <label>Vermeidbarkeit P<select onchange="setRiskField('${h.id}','P',this.value)">${scoreOptions(['1 - möglich','2 - kaum möglich'],r.P)}</select></label>
    </div>
    <label class="full">Maßnahmen<textarea oninput="setRiskField('${h.id}','measures',this.value)">${escapeHtml(r.measures||((h.standardMassnahmen||[]).join('\n')))}</textarea></label>
    <label class="full">Restrisiko / Hinweis<textarea oninput="setRiskField('${h.id}','residualRisk',this.value)">${escapeHtml(r.residualRisk||'Restrisiko nach Umsetzung der Maßnahmen bewerten und in der Betriebsanleitung beschreiben.')}</textarea></label>
    <div class="risk-result ${score.className}">${score.text}</div>
  </div>
</article>`; }
function scoreOptions(options,value){ return '<option value="">Bitte wählen</option>'+options.map((o,i)=>`<option value="${i+1}" ${String(value)===String(i+1)?'selected':''}>${o}</option>`).join(''); }
function setRiskAnswer(id,answer){ if(!currentProject.risks)currentProject.risks={}; if(!currentProject.risks[id])currentProject.risks[id]={}; currentProject.risks[id].answer=answer; renderRisks(); renderDashboard(); }
function setRiskField(id,field,value){ if(!currentProject.risks)currentProject.risks={}; if(!currentProject.risks[id])currentProject.risks[id]={answer:'yes'}; currentProject.risks[id][field]=value; updateRiskCardResult(id); renderDashboard(); updateRiskSummary(); }
function updateRiskCardResult(id){ const card=document.querySelector(`.risk-card[data-id="${id}"]`); if(!card)return; const result=card.querySelector('.risk-result'); const score=getRiskScore(currentProject.risks[id]||{}); result.className='risk-result '+score.className; result.textContent=score.text; }
function getRiskScore(r){ const s=Number(r.S||0), f=Number(r.F||0), p=Number(r.P||0); if(!s||!f||!p)return {value:0,className:'medium',text:'Risikowert: noch nicht vollständig bewertet'}; const v=s*f*p; if(v<=2)return {value:v,className:'low',text:`Risikowert ${v}: niedrig / akzeptabel prüfen`}; if(v<=4)return {value:v,className:'medium',text:`Risikowert ${v}: mittel / Maßnahmen erforderlich prüfen`}; return {value:v,className:'high',text:`Risikowert ${v}: hoch / Risikominderung erforderlich`}; }
function updateRiskSummary(){ const relevant=getRelevantHazards(); const answered=relevant.filter(h=>currentProject.risks?.[h.id]?.answer).length; const yes=relevant.filter(h=>currentProject.risks?.[h.id]?.answer==='yes').length; $('#riskAnswered').textContent=`${answered} / ${relevant.length} beantwortet`; $('#riskYesCount').textContent=`${yes} Gefährdungen vorhanden`; }
function groupBy(arr,fn){ return arr.reduce((acc,x)=>{ const k=fn(x)||'Sonstige'; (acc[k] ||= []).push(x); return acc; },{}); }
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function escapeAttr(s){return escapeHtml(s).replace(/'/g,'&#39;')}
window.loadProject=loadProject; window.deleteProject=deleteProject; window.setRiskAnswer=setRiskAnswer; window.setRiskField=setRiskField; document.addEventListener('DOMContentLoaded',init);
