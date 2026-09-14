export const P204_PROGRESS_KEY = "emc_test_progress_p204_v1";
// No sourced category table exists in the project yet. Do not promote quiz data to normative data.
export const P204_MODEL = Object.freeze({ id: "p204", categories: [], commonSteps: [], calculations: [] });
export const createP204Progress = (value = {}) => ({ version:1, selectedCategoryId:null, categoryRevision:0, userValues:{}, equipmentAssignments:{}, checklist:{}, completedSteps:{}, currentStep:0, observations:{initial:"",during:"",deviation:"",comment:""}, stepResults:{}, result:"incomplete", ...value });
export function selectP204Category(progress, categoryId, model=P204_MODEL) { if (!model.categories.some(c=>c.id===categoryId)||progress.selectedCategoryId===categoryId) return progress; return createP204Progress({...progress,selectedCategoryId:categoryId,categoryRevision:(progress.categoryRevision||0)+1,userValues:{},equipmentAssignments:{},completedSteps:{},currentStep:0}); }
export const updateP204Progress = (progress,patch) => createP204Progress({...progress,...patch});
export function loadP204Progress(storage) { try { const value=JSON.parse(storage?.getItem(P204_PROGRESS_KEY)||"null"); return createP204Progress(value&&typeof value==="object"?value:{}); } catch { return createP204Progress(); } }
export function saveP204Progress(storage,progress) { const value=createP204Progress(progress); storage?.setItem(P204_PROGRESS_KEY,JSON.stringify(value)); return value; }
export function resetP204Progress(storage) { const value=createP204Progress(); storage?.setItem(P204_PROGRESS_KEY,JSON.stringify(value)); return value; }
export const getP204Category = (progress,model=P204_MODEL) => model.categories.find(c=>c.id===progress.selectedCategoryId)||null;
export const getP204Steps = (progress,model=P204_MODEL,userSteps=[]) => [...(model.commonSteps||[]),...(getP204Category(progress,model)?.procedureSteps||[]),...(userSteps||[])].map((step,index)=>({...step,id:step.id||`user-${index}`,n:index+1}));
