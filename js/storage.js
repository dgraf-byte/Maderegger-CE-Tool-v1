const KEY='maderegger-ce-suite-m312';
const LEGACY_KEYS=['maderegger-ce-suite-s62','maderegger-ce-suite-s63','maderegger-ce-suite'];

function emptyState(){return{projects:[],activeProjectId:null}}
function object(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function normalizeRisk(value){return object(value)}
function normalizeProject(value){
  const p=object(value);
  return{
    ...p,
    id:String(p.id||createProjectId()),
    risk:normalizeRisk(p.risk),
    components:object(p.components),
    excludedRiskGroups:Array.isArray(p.excludedRiskGroups)?p.excludedRiskGroups.filter(x=>typeof x==='string'):[],
    equipment:Array.isArray(p.equipment)?p.equipment:[],
    lifePhases:Array.isArray(p.lifePhases)?p.lifePhases:[]
  };
}
function normalizeState(value){
  const raw=object(value);
  const projects=Array.isArray(raw.projects)?raw.projects.map(normalizeProject):[];
  let activeProjectId=typeof raw.activeProjectId==='string'?raw.activeProjectId:null;
  if(activeProjectId&&!projects.some(p=>p.id===activeProjectId))activeProjectId=projects[0]?.id||null;
  return{...raw,projects,activeProjectId};
}
function parse(key){
  try{const text=localStorage.getItem(key);return text?JSON.parse(text):null}catch(error){console.warn(`Ungültiger Speicherstand unter ${key} wurde ignoriert.`,error);return null}
}
export function loadState(){
  const current=parse(KEY);
  if(current)return normalizeState(current);
  for(const legacyKey of LEGACY_KEYS){
    const legacy=parse(legacyKey);
    if(!legacy)continue;
    const migrated=normalizeState(legacy);
    try{localStorage.setItem(KEY,JSON.stringify(migrated))}catch{}
    return migrated;
  }
  return emptyState();
}
export function saveState(state){
  const normalized=normalizeState(state);
  state.projects=normalized.projects;
  state.activeProjectId=normalized.activeProjectId;
  try{localStorage.setItem(KEY,JSON.stringify(normalized))}catch(error){console.error('Projekt konnte nicht lokal gespeichert werden.',error)}
}
export function createProjectId(){return `P-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}
export function activeProject(state){
  if(!state||!Array.isArray(state.projects))return null;
  return state.projects.find(p=>p?.id===state.activeProjectId)||null;
}
