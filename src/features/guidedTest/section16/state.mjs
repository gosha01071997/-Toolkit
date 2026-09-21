export const SECTION_16_SCENARIO_ID = "section-16-power-input-v1";
export function createSection16Result(progress, profile, procedures) {
  return { date: new Date().toISOString(), test: "section-16", normativeProfile: profile.id, workplace: progress.inputs.workplace || "",
    product: { name: progress.inputs.eutName || "", model: progress.inputs.eutModel || "" }, configuration: { ...progress.configuration },
    equipmentInstances: Object.values(progress.equipment || {}).filter(Boolean), execution: { mode: progress.executionMode, automationSystemId: progress.automationSystemId || null },
    parameters: { ...progress.parameters }, conditions: { ...progress.conditions }, measurements: { ...progress.measurements }, photos: [], notes: progress.notes || "",
    procedureResults: { ...progress.procedureResults }, procedures: procedures.map(item => item.id), result: progress.overallResult || "recorded" };
}
