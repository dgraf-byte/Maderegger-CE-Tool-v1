const KEY='maderegger-ce-suite-s62';
export function loadState(){try{return JSON.parse(localStorage.getItem(KEY))||{projects:[],activeProjectId:null}}catch{return{projects:[],activeProjectId:null}}}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state))}
export function createProjectId(){return `P-${Date.now()}`}
export function activeProject(state){return state.projects.find(p=>p.id===state.activeProjectId)||null}
