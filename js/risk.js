import{qs,qsa,escapeHtml,toast}from'./ui.js';
import{activeProject}from'./storage.js';

let ctx=null;
let activeGroup=null;
let activeSub=null;
let filter='all';
let allOpen=false;

export function initRisk(options){
  ctx=options;
  qs('#riskTree').addEventListener('click',onTreeClick);
  qs('#componentQuestions').addEventListener('click',onComponentClick);
  qs('#resetComponentsBtn').onclick=resetComponents;
  qs('#riskGroupSelector').addEventListener('change',onGroupSelectionChange);
  qs('#selectAllRiskGroupsBtn').onclick=selectAllGroups;
  qs('#riskList').addEventListener('click',onRiskClick);
  qs('#riskList').addEventListener('input',onRiskInput);
  qs('#riskList').addEventListener('change',onRiskChange);
  qsa('[data-filter]').forEach(button=>{
    button.onclick=()=>{
      filter=button.dataset.filter;
      qsa('[data-filter]').forEach(x=>x.classList.toggle('active',x===button));
      renderRisk();
    };
  });
  qs('#expandAllBtn').onclick=()=>{
    allOpen=!allOpen;
    qs('#expandAllBtn').textContent=allOpen?'Alle schließen':'Alle öffnen';
    const residual=qs(`#residual-badge-${CSS.escape(id)}`);if(residual)residual.innerHTML=residualBadge(risk);
  renderTree();
  };
  qs('#saveRiskBottomBtn').onclick=()=>{
    ctx.onChange();
    toast('Risikoanalyse gespeichert');
  };
  renderRisk();
}

export function renderRisk(){
  const project=activeProject(ctx.state);
  if(!project){
    qs('#riskTree').innerHTML='<div class="empty-state">Zuerst ein Projekt anlegen.</div>';
    qs('#riskList').innerHTML='<div class="empty-state">Keine aktive Risikoanalyse.</div>';
    updateSummary([],null);
    return;
  }
  project.risk??={};
  project.components??={};
  project.excludedRiskGroups??=[];
  renderComponents(project);
  renderGroupSelector(project);
  renderTree();
  const relevant=getRelevant(project);
  let shown=relevant.filter(item=>(!activeGroup||item.gruppe===activeGroup)&&(!activeSub||item.untergruppe===activeSub));
  if(filter==='open')shown=shown.filter(item=>!project.risk[item.id]?.answer);
  if(filter==='yes')shown=shown.filter(item=>project.risk[item.id]?.answer==='yes');
  if(filter==='incomplete')shown=shown.filter(item=>!isComplete(project.risk[item.id]||{}));
  qs('#activeRiskPath').textContent=activeSub?`${activeGroup} › ${activeSub}`:(activeGroup||'Alle Gefährdungen');
  qs('#riskList').innerHTML=shown.length?shown.map(item=>card(item,project.risk[item.id]||{})).join(''):'<div class="empty-state">Keine Fragen in diesem Filter.</div>';
  updateSummary(relevant,project);
}

function getCandidates(project){
  // Sondermaschinen erhalten bewusst immer den vollständigen Standardkatalog.
  if(project.machineType==='sondermaschine')return ctx.dangers;
  let candidates=ctx.dangers.filter(item=>!project.machineType||item.maschinen.includes(project.machineType));
  const answered=project.components||{};
  const hiddenGroups=new Set();
  const hiddenHazards=new Set();
  for(const component of ctx.components||[]){
    if(answered[component.id]!=='no')continue;
    (component.groups||[]).forEach(group=>hiddenGroups.add(group));
    (component.hazards||[]).forEach(id=>hiddenHazards.add(id));
  }
  // Eine Gruppe wird nur ausgeblendet, wenn alle Komponenten, die sie aktivieren können, mit Nein beantwortet sind.
  for(const group of [...hiddenGroups]){
    const related=(ctx.components||[]).filter(c=>(c.groups||[]).includes(group));
    if(related.some(c=>answered[c.id]!=='no'))hiddenGroups.delete(group);
  }
  return candidates.filter(item=>!hiddenGroups.has(item.gruppe)&&!hiddenHazards.has(item.id));
}

function renderComponents(project){
  const host=qs('#componentQuestions');if(!host)return;
  host.innerHTML=(ctx.components||[]).map(component=>{const value=project.components?.[component.id]||'';return `<article class="component-question ${value?'answered':''}"><div><strong>${escapeHtml(component.label)}</strong><p>${escapeHtml(component.frage)}</p></div><div class="answer-buttons"><button type="button" class="answer-btn yes ${value==='yes'?'active':''}" data-component-answer="yes" data-component-id="${component.id}">Ja</button><button type="button" class="answer-btn no ${value==='no'?'active':''}" data-component-answer="no" data-component-id="${component.id}">Nein</button></div></article>`}).join('');
  const done=Object.values(project.components||{}).filter(Boolean).length;
  const hint=qs('#componentHint');if(hint)hint.textContent=project.machineType==='sondermaschine'?`Sondermaschine: Vollständiger Standardkatalog bleibt aktiv · ${done}/${(ctx.components||[]).length} Komponentenfragen beantwortet.`:`${done}/${(ctx.components||[]).length} Komponentenfragen beantwortet. Unbeantwortete Komponenten blenden keine Gefährdungen aus.`;
}
function onComponentClick(event){const btn=event.target.closest('[data-component-answer]');if(!btn)return;const project=activeProject(ctx.state);project.components??={};project.components[btn.dataset.componentId]=btn.dataset.componentAnswer;ctx.onChange({silent:true});renderRisk();}
function resetComponents(){const project=activeProject(ctx.state);if(!project)return;project.components={};ctx.onChange({silent:true});renderRisk();toast('Komponentenfragen zurückgesetzt');}


function getRelevant(project){
  const excluded=new Set(project.excludedRiskGroups||[]);
  return getCandidates(project).filter(item=>!excluded.has(item.gruppe));
}

function renderGroupSelector(project){
  const candidates=getCandidates(project);
  const groups=[...new Set(candidates.map(item=>item.gruppe))].sort((a,b)=>a.localeCompare(b,'de'));
  const excluded=new Set(project.excludedRiskGroups||[]);
  qs('#riskGroupSelector').innerHTML=groups.length?groups.map(group=>{
    const items=candidates.filter(item=>item.gruppe===group);
    const active=!excluded.has(group);
    return `<label class="risk-group-option ${active?'active':''}">
      <input type="checkbox" data-risk-group="${escapeHtml(group)}" ${active?'checked':''}>
      <span class="risk-group-option-text"><strong>${escapeHtml(group)}</strong><small>${items.length} Standard-Gefährdungen</small></span>
    </label>`;
  }).join(''):'<div class="empty-state">Für diese Maschinenart sind noch keine Gefährdungsgruppen hinterlegt.</div>';
}

function onGroupSelectionChange(event){
  const input=event.target.closest('[data-risk-group]');
  if(!input)return;
  const project=activeProject(ctx.state);
  const excluded=new Set(project.excludedRiskGroups||[]);
  if(input.checked)excluded.delete(input.dataset.riskGroup);
  else excluded.add(input.dataset.riskGroup);
  project.excludedRiskGroups=[...excluded];
  if(excluded.has(activeGroup)){activeGroup=null;activeSub=null;}
  ctx.onChange({silent:true});
  renderRisk();
}

function selectAllGroups(){
  const project=activeProject(ctx.state);
  if(!project)return;
  project.excludedRiskGroups=[];
  ctx.onChange({silent:true});
  renderRisk();
  toast('Alle Gefährdungsgruppen aktiviert');
}

function grouped(project){
  const output={};
  for(const item of getRelevant(project)){
    output[item.gruppe]??={};
    output[item.gruppe][item.untergruppe]??=[];
    output[item.gruppe][item.untergruppe].push(item);
  }
  return output;
}

function renderTree(){
  const project=activeProject(ctx.state);
  if(!project)return;
  const groups=grouped(project);
  qs('#riskTree').innerHTML=Object.entries(groups).map(([group,subs])=>{
    const items=Object.values(subs).flat();
    const answered=items.filter(item=>project.risk[item.id]?.answer).length;
    const yes=items.filter(item=>project.risk[item.id]?.answer==='yes').length;
    const complete=items.filter(item=>isComplete(project.risk[item.id]||{})).length;
    const open=allOpen||activeGroup===group;
    return `<div class="tree-group ${open?'open':''}">
      <button class="tree-group-btn ${activeGroup===group&&!activeSub?'active':''}" data-group="${escapeHtml(group)}">
        <div class="tree-group-main"><span>${open?'▼':'▶'} ${escapeHtml(group)}</span><span>${complete}/${items.length}</span></div>
        <div class="tree-group-meta">${answered} beantwortet · ${yes} Ja · ${items.length-complete} unvollständig</div>
        <div class="tree-progress"><span style="width:${items.length?complete/items.length*100:0}%"></span></div>
      </button>
      <div class="tree-children">${Object.entries(subs).map(([sub,list])=>{
        const answeredSub=list.filter(item=>project.risk[item.id]?.answer).length;
        const yesSub=list.filter(item=>project.risk[item.id]?.answer==='yes').length;
        const completeSub=list.filter(item=>isComplete(project.risk[item.id]||{})).length;
        const state=completeSub===list.length?'complete':answeredSub?'partial':'open';
        return `<button class="tree-sub-btn ${activeSub===sub?'active':''} state-${state}" data-group="${escapeHtml(group)}" data-sub="${escapeHtml(sub)}">
          <div class="tree-sub-main"><span><span class="tree-state-dot"></span>${escapeHtml(sub)}</span><span>${completeSub}/${list.length}</span></div>
          <div class="tree-sub-meta">${yesSub} Ja · ${list.length-completeSub} unvollständig</div>
        </button>`;
      }).join('')}</div>
    </div>`;
  }).join('');
}

function onTreeClick(event){
  const sub=event.target.closest('[data-sub]');
  if(sub){
    activeGroup=sub.dataset.group;
    activeSub=sub.dataset.sub;
    renderRisk();
    return;
  }
  const group=event.target.closest('[data-group]');
  if(group){
    const same=activeGroup===group.dataset.group&&!activeSub;
    activeGroup=same?null:group.dataset.group;
    activeSub=null;
    renderRisk();
  }
}

function onRiskClick(event){
  const answerButton=event.target.closest('[data-answer]');
  if(answerButton){
    const project=activeProject(ctx.state);
    const id=answerButton.dataset.id;
    project.risk[id]??={};
    project.risk[id].answer=answerButton.dataset.answer;
    project.risk[id].updatedAt=new Date().toISOString();
    ctx.onChange();
    renderRisk();
    return;
  }

  const applyButton=event.target.closest('[data-apply-measures]');
  if(applyButton){
    const project=activeProject(ctx.state);
    const id=applyButton.dataset.applyMeasures;
    const risk=project.risk[id]??={};
    const selected=Array.isArray(risk.selectedMeasures)?risk.selectedMeasures:[];
    if(!selected.length){
      toast('Bitte zuerst mindestens eine Maßnahme auswählen');
      return;
    }
    const existing=(risk.measure||'').trim();
    const block=selected.map(item=>`• ${item}`).join('\n');
    risk.measure=existing?`${existing}\n${block}`:block;
    risk.updatedAt=new Date().toISOString();
    ctx.onChange();
    renderRisk();
    toast('Ausgewählte Maßnahmen übernommen');
  }
}

function onRiskInput(event){
  const field=event.target.closest('[data-risk-field]');
  if(!field)return;
  const project=activeProject(ctx.state);
  const risk=project.risk[field.dataset.id]??={};
  risk[field.dataset.riskField]=field.value;
  risk.updatedAt=new Date().toISOString();
  ctx.onChange({silent:true});
  refreshCardState(field.dataset.id,risk);
}

function onRiskChange(event){
  const checkbox=event.target.closest('[data-measure-option]');
  if(!checkbox)return;
  const project=activeProject(ctx.state);
  const id=checkbox.dataset.id;
  const risk=project.risk[id]??={};
  const checked=qsa(`[data-measure-option][data-id="${CSS.escape(id)}"]:checked`).map(item=>item.value);
  risk.selectedMeasures=checked;
  risk.updatedAt=new Date().toISOString();
  ctx.onChange({silent:true});
  refreshCardState(id,risk);
}

function card(item,risk){
  const score=calculateScore(risk);
  const status=cardStatus(risk);
  const badge=score?riskBadge(score):'<span class="risk-badge neutral">noch nicht bewertet</span>';
  const completionLabel=status==='complete'?'Vollständig':status==='incomplete'?'Bewertung offen':risk.answer==='no'?'Nicht vorhanden':'Offen';
  const selected=new Set(Array.isArray(risk.selectedMeasures)?risk.selectedMeasures:[]);
  return `<article class="risk-card status-${status}" data-risk-id="${item.id}">
    <div class="risk-question">
      <div class="risk-question-head">
        <div>
          <div class="risk-code">${escapeHtml(item.id)} · ${escapeHtml(item.bereich||'')}</div>
          <h3>${escapeHtml(item.frage)}</h3>
          <div class="risk-context">${escapeHtml(item.gruppe)} › ${escapeHtml(item.untergruppe)}</div>
        </div>
        <div class="risk-card-actions">
          <span class="completion-badge ${status}">${completionLabel}</span>
          <div class="answer-buttons">
            <button type="button" class="answer-btn yes ${risk.answer==='yes'?'active':''}" data-answer="yes" data-id="${item.id}">Ja</button>
            <button type="button" class="answer-btn no ${risk.answer==='no'?'active':''}" data-answer="no" data-id="${item.id}">Nein</button>
          </div>
        </div>
      </div>
    </div>
    <div class="risk-details">
      <div class="detail-grid">
        <label class="wide">Beschreibung der konkreten Gefährdung<textarea rows="3" data-risk-field="description" data-id="${item.id}" placeholder="Gefahrstelle, betroffene Person und mögliche Folge beschreiben …">${escapeHtml(risk.description||'')}</textarea></label>
        <label>Schwere S<select data-risk-field="severity" data-id="${item.id}"><option value="">– auswählen –</option><option value="1" ${risk.severity==='1'?'selected':''}>S1 – leicht / reversibel</option><option value="2" ${risk.severity==='2'?'selected':''}>S2 – schwer / irreversibel</option></select></label>
        <label>Häufigkeit F<select data-risk-field="frequency" data-id="${item.id}"><option value="">– auswählen –</option><option value="1" ${risk.frequency==='1'?'selected':''}>F1 – selten / kurz</option><option value="2" ${risk.frequency==='2'?'selected':''}>F2 – häufig / lang</option></select></label>
        <label>Vermeidbarkeit P<select data-risk-field="possibility" data-id="${item.id}"><option value="">– auswählen –</option><option value="1" ${risk.possibility==='1'?'selected':''}>P1 – möglich</option><option value="2" ${risk.possibility==='2'?'selected':''}>P2 – kaum möglich</option></select></label>
        <div class="wide risk-rating-row"><strong>Risikoeinstufung vor Maßnahme</strong><span id="badge-${item.id}">${badge}</span></div>
        <div class="wide residual-rating"><strong>Risikoeinstufung nach Maßnahme</strong><div class="residual-selects"><label>Rest-S<select data-risk-field="residualSeverity" data-id="${item.id}"><option value="">–</option><option value="1" ${risk.residualSeverity==='1'?'selected':''}>S1</option><option value="2" ${risk.residualSeverity==='2'?'selected':''}>S2</option></select></label><label>Rest-F<select data-risk-field="residualFrequency" data-id="${item.id}"><option value="">–</option><option value="1" ${risk.residualFrequency==='1'?'selected':''}>F1</option><option value="2" ${risk.residualFrequency==='2'?'selected':''}>F2</option></select></label><label>Rest-P<select data-risk-field="residualPossibility" data-id="${item.id}"><option value="">–</option><option value="1" ${risk.residualPossibility==='1'?'selected':''}>P1</option><option value="2" ${risk.residualPossibility==='2'?'selected':''}>P2</option></select></label></div><span id="residual-badge-${item.id}">${residualBadge(risk)}</span></div>
        <div class="wide standard-measures">
          <div class="measure-head"><div><strong>Vorgeschlagene Maßnahmen</strong><div class="muted">Auswählen und anschließend übernehmen. Eigene Ergänzungen bleiben möglich.</div></div><button type="button" class="btn small" data-apply-measures="${item.id}">Ausgewählte übernehmen</button></div>
          <div class="measure-options">${(item.standardMassnahmen||[]).map((measure,index)=>`<label class="measure-option"><input type="checkbox" data-measure-option data-id="${item.id}" value="${escapeHtml(measure)}" ${selected.has(measure)?'checked':''}><span>${escapeHtml(measure)}</span></label>`).join('')}</div>
        </div>
        <label class="wide">Gewählte technische und organisatorische Maßnahmen<textarea rows="4" data-risk-field="measure" data-id="${item.id}" placeholder="Umgesetzte Maßnahmen dokumentieren …">${escapeHtml(risk.measure||'')}</textarea></label>
        <label class="wide">Restrisiko / Benutzerinformation<textarea rows="3" data-risk-field="residualRisk" data-id="${item.id}" placeholder="Verbleibendes Restrisiko und Hinweise für Betriebsanleitung …">${escapeHtml(risk.residualRisk||'')}</textarea></label>
        <div class="wide reference-box"><div><strong>Normenbezug</strong><div class="norm-chips">${(item.normen||[]).map(norm=>`<span>${escapeHtml(norm)}</span>`).join('')}</div></div><div><strong>Relevante Lebensphasen</strong><div class="life-chips">${(item.lebensphasen||[]).map(phase=>`<span>${escapeHtml(phase)}</span>`).join('')}</div></div></div>
      </div>
    </div>
  </article>`;
}

function calculateScore(risk){
  return Number(risk.severity||0)*Number(risk.frequency||0)*Number(risk.possibility||0);
}

function isComplete(risk){
  if(risk.answer==='no')return true;
  if(risk.answer!=='yes')return false;
  const hasAssessment=Boolean(risk.severity&&risk.frequency&&risk.possibility);
  const hasMeasure=Boolean((risk.measure||'').trim()||(Array.isArray(risk.selectedMeasures)&&risk.selectedMeasures.length));
  const hasResidual=Boolean(risk.residualSeverity&&risk.residualFrequency&&risk.residualPossibility);
  return hasAssessment&&hasMeasure&&hasResidual;
}

function cardStatus(risk){
  if(risk.answer==='no')return 'no';
  if(risk.answer==='yes')return isComplete(risk)?'complete':'incomplete';
  return 'open';
}

function residualBadge(risk){const score=Number(risk.residualSeverity||0)*Number(risk.residualFrequency||0)*Number(risk.residualPossibility||0);return score?riskBadge(score):'<span class="risk-badge neutral">Restrisiko nicht bewertet</span>';}

function riskBadge(score){
  const cls=score>=6?'high':score>=3?'medium':'low';
  const text=score>=6?'hoch':score>=3?'mittel':'niedrig';
  return `<span class="risk-badge ${cls}">${text} · Risikowert ${score}</span>`;
}

function refreshCardState(id,risk){
  const cardElement=qs(`[data-risk-id="${CSS.escape(id)}"]`);
  if(!cardElement)return;
  const status=cardStatus(risk);
  cardElement.className=`risk-card status-${status}`;
  const completion=cardElement.querySelector('.completion-badge');
  if(completion){
    completion.className=`completion-badge ${status}`;
    completion.textContent=status==='complete'?'Vollständig':status==='incomplete'?'Bewertung offen':risk.answer==='no'?'Nicht vorhanden':'Offen';
  }
  const badge=qs(`#badge-${CSS.escape(id)}`);
  if(badge){
    const score=calculateScore(risk);
    badge.innerHTML=score?riskBadge(score):'<span class="risk-badge neutral">noch nicht bewertet</span>';
  }
  renderTree();
  const project=activeProject(ctx.state);
  updateSummary(getRelevant(project),project);
}

function updateSummary(relevant,project){
  const answered=project?relevant.filter(item=>project.risk[item.id]?.answer).length:0;
  const yes=project?relevant.filter(item=>project.risk[item.id]?.answer==='yes').length:0;
  const complete=project?relevant.filter(item=>isComplete(project.risk[item.id]||{})).length:0;
  qs('#riskAnswered').textContent=`${answered} / ${relevant.length} beantwortet`;
  qs('#riskYesCount').textContent=`${yes} Gefährdungen vorhanden`;
  const completeElement=qs('#riskCompleteCount');
  if(completeElement)completeElement.textContent=`${complete} vollständig abgeschlossen`;
  updateProjectCheck(relevant,project,complete);
}
function updateProjectCheck(relevant,project,complete){const checks=[['Projektdaten',Boolean(project?.projectNo&&project?.projectName&&project?.machineType)],['Komponenten',Boolean(project&&(ctx.components||[]).every(c=>project.components?.[c.id]))],['Gefährdungsgruppen',Boolean(project&&relevant.length)],['Risikoanalyse',Boolean(relevant.length&&complete===relevant.length)],['Maßnahmen',Boolean(project&&relevant.filter(i=>project.risk?.[i.id]?.answer==='yes').every(i=>(project.risk[i.id].measure||'').trim()))],['Restrisiken',Boolean(project&&relevant.filter(i=>project.risk?.[i.id]?.answer==='yes').every(i=>project.risk[i.id].residualSeverity&&project.risk[i.id].residualFrequency&&project.risk[i.id].residualPossibility))]];const done=checks.filter(x=>x[1]).length;const pct=Math.round(done/checks.length*100);const list=qs('#projectCheckList');if(list)list.innerHTML=checks.map(([label,ok])=>`<span class="check-status ${ok?'ok':'open'}">${ok?'✓':'○'} ${escapeHtml(label)}</span>`).join('');const pe=qs('#projectCheckPercent');if(pe)pe.textContent=`${pct} %`;const bar=qs('#projectCheckBar');if(bar)bar.style.width=`${pct}%`;}

