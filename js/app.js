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
let currentProject={equipment:[],lifePhases:[]};
let projects=JSON.parse(localStorage.getItem('mce_projects')||'[]');
function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}
function init(){setupNav();renderSelects();renderChecks();bindForm();renderDashboard();renderNorms();}
function setupNav(){ $all('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{ $all('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); $all('.view').forEach(v=>v.classList.remove('active')); $('#'+btn.dataset.view).classList.add('active'); $('#pageTitle').textContent=btn.textContent; })); }
function renderSelects(){ const sel=$('#machineTypeSelect'); sel.innerHTML='<option value="">Bitte wählen</option>'+machineTypes.map(m=>`<option value="${m.id}">${m.name}</option>`).join(''); }
function renderChecks(){ $('#equipmentList').innerHTML=equipment.map(x=>`<label class="check-item"><input type="checkbox" name="equipment" value="${x}">${x}</label>`).join(''); $('#lifePhaseList').innerHTML=lifePhases.map(x=>`<label class="check-item"><input type="checkbox" name="lifePhases" value="${x}">${x}</label>`).join(''); }
function bindForm(){ const form=$('#projectForm'); form.addEventListener('input',updateFromForm); form.addEventListener('change',updateFromForm); $('#saveProjectBtn').addEventListener('click',saveProject); $('#newProjectBtn').addEventListener('click',newProject); $('#exportJsonBtn').addEventListener('click',exportJson); }
function updateFromForm(){ const fd=new FormData($('#projectForm')); currentProject=Object.fromEntries(fd.entries()); currentProject.equipment=fd.getAll('equipment'); currentProject.lifePhases=fd.getAll('lifePhases'); renderDashboard(); renderNorms(); }
function fillForm(p){ const form=$('#projectForm'); form.reset(); Object.entries(p).forEach(([k,v])=>{ if(Array.isArray(v))return; const el=form.elements[k]; if(el) el.value=v; }); $all('input[name="equipment"]').forEach(i=>i.checked=(p.equipment||[]).includes(i.value)); $all('input[name="lifePhases"]').forEach(i=>i.checked=(p.lifePhases||[]).includes(i.value)); currentProject=structuredClone(p); renderDashboard(); renderNorms(); }
function getMachine(){ return machineTypes.find(m=>m.id===currentProject.machineType); }
function completion(){ let keys=['projectNo','projectName','customer','designer','ceResponsible','machineType','machineName']; let filled=keys.filter(k=>currentProject[k]).length; if((currentProject.lifePhases||[]).length)filled++; if((currentProject.equipment||[]).length)filled++; return Math.round(filled/(keys.length+2)*100); }
function renderDashboard(){ const m=getMachine(); $('#dashProject').textContent=currentProject.projectName||currentProject.projectNo||'Kein Projekt gewählt'; $('#dashCustomer').textContent=currentProject.customer||'Bitte Projektdaten erfassen.'; $('#dashMachine').textContent=m?m.name:'-'; $('#dashNorms').textContent=m?`${m.norms.length} Normen vorgeschlagen`:'Normen werden automatisch vorgeschlagen.'; const c=completion(); $('#dashProgress').textContent=c+'%'; $('#progressBar').style.width=c+'%'; renderProjectList(); }
function renderProjectList(){ const box=$('#projectList'); if(!projects.length){box.innerHTML='<p class="muted">Noch keine Projekte gespeichert.</p>';return;} box.innerHTML=projects.map((p,i)=>`<div class="project-item"><strong>${p.projectNo||'ohne Nr.'} – ${p.projectName||'ohne Name'}</strong><br><span>${p.customer||'kein Kunde'} · ${p.machineName||''}</span><br><button class="btn" onclick="loadProject(${i})">Öffnen</button> <button class="btn" onclick="deleteProject(${i})">Löschen</button></div>`).join(''); }
function renderNorms(){ const m=getMachine(); const norms=m?m.norms:[]; $('#normList').innerHTML=norms.length?norms.map(n=>`<div class="norm-item"><strong>${n}</strong><span>${normDescriptions[n]||'Beschreibung folgt.'}</span></div>`).join(''):'<p class="muted">Bitte zuerst eine Maschinenart wählen.</p>'; }
function saveProject(){ updateFromForm(); if(!currentProject.projectNo && !currentProject.projectName){alert('Bitte mindestens Projektnummer oder Projektname eintragen.');return;} const id=currentProject.id||Date.now().toString(); currentProject.id=id; const idx=projects.findIndex(p=>p.id===id); if(idx>=0)projects[idx]=structuredClone(currentProject); else projects.unshift(structuredClone(currentProject)); localStorage.setItem('mce_projects',JSON.stringify(projects)); renderDashboard(); alert('Projekt gespeichert.'); }
function newProject(){ currentProject={equipment:[],lifePhases:[]}; fillForm(currentProject); document.querySelector('[data-view="project"]').click(); }
function loadProject(i){ fillForm(projects[i]); document.querySelector('[data-view="project"]').click(); }
function deleteProject(i){ if(confirm('Projekt wirklich löschen?')){projects.splice(i,1); localStorage.setItem('mce_projects',JSON.stringify(projects)); renderDashboard();} }
function exportJson(){ updateFromForm(); const blob=new Blob([JSON.stringify(currentProject,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(currentProject.projectNo||'projekt')+'_ce_suite.json'; a.click(); URL.revokeObjectURL(a.href); }
window.loadProject=loadProject; window.deleteProject=deleteProject; document.addEventListener('DOMContentLoaded',init);
