const CE = {
  projects: JSON.parse(localStorage.getItem('mce_projects') || '[]'),
  machines: [],
  norms: []
};

async function loadData(){
  try{
    CE.machines = await fetch('data/maschinen.json').then(r=>r.json());
    CE.norms = await fetch('data/normen.json').then(r=>r.json());
  }catch(e){
    console.warn('Daten konnten nicht geladen werden', e);
    CE.machines = [{id:'foerderband',name:'Förderband'}];
    CE.norms = [];
  }
}

function setView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelector(`#view-${view}`)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  const title = document.querySelector(`.nav-btn[data-view="${view}"]`)?.textContent || 'Dashboard';
  document.getElementById('pageTitle').textContent = title;
}

function renderMachines(){
  const select = document.getElementById('machineType');
  select.innerHTML = CE.machines.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
}

function renderNorms(){
  const el = document.getElementById('normList');
  el.innerHTML = CE.norms.map(n=>`<div class="norm-item"><strong>${n.code}</strong><span>${n.title}</span></div>`).join('');
}

function renderProjects(){
  document.getElementById('projectCount').textContent = CE.projects.length;
  const html = CE.projects.length ? CE.projects.slice().reverse().map(p=>`
    <div class="project-item">
      <div><b>${p.projectNo || 'ohne Nr.'} – ${p.machineName || 'Maschine'}</b><span>${p.customer || 'kein Kunde'} · ${p.machineTypeLabel || p.machineType}</span></div>
      <span>${p.createdAt}</span>
    </div>`).join('') : '<div class="empty">Noch kein Projekt angelegt.</div>';
  document.getElementById('recentProjects').innerHTML = html;
  document.getElementById('projectList').innerHTML = html;
}

function saveProject(form){
  const fd = new FormData(form);
  const p = Object.fromEntries(fd.entries());
  const machine = CE.machines.find(m=>m.id===p.machineType);
  p.machineTypeLabel = machine?.name || p.machineType;
  p.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  p.createdAt = new Date().toLocaleDateString('de-AT');
  CE.projects.push(p);
  localStorage.setItem('mce_projects', JSON.stringify(CE.projects));
  form.reset();
  renderProjects();
  setView('projects');
}

async function init(){
  await loadData();
  renderMachines();
  renderNorms();
  renderProjects();
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
  document.getElementById('newProjectTop').addEventListener('click',()=>setView('newProject'));
  document.getElementById('projectForm').addEventListener('submit',e=>{e.preventDefault();saveProject(e.target);});
}

document.addEventListener('DOMContentLoaded', init);
