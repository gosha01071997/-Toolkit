export const AUTOMATION_SYSTEMS = Object.freeze([
  { id: "other", manufacturer: "", name: "Другое ПО", version: "", supportedProcedureTypes: [], verifiedCapabilities: [], source: null, notes: "Совместимость указывает инженер." },
  { id: "own-stand", manufacturer: "", name: "Собственный стенд лаборатории", version: "", supportedProcedureTypes: [], verifiedCapabilities: [], source: null, notes: "Параметры хранятся в профиле лабораторного стенда." },
]);

export function automationSystemById(id) { return AUTOMATION_SYSTEMS.find(system => system.id === id) || null; }
export function verifiedForProcedure(system, procedure) {
  return Boolean(system && procedure && system.supportedProcedureTypes.includes(procedure.type)
    && system.verifiedCapabilities.length && system.source);
}

export function executionPlan(procedure, mode, adapter = null) {
  if (!procedure || !procedure.executionModes.includes(mode)) return null;
  if (mode === "manual") return { procedureId: procedure.id, mode, setup: procedure.setup, parameters: procedure.parameters, actions: procedure.actions, monitoring: procedure.monitoring, result: procedure.result };
  return { procedureId: procedure.id, mode, setup: procedure.setup, parameters: procedure.parameters,
    actions: ["Передайте подтверждённые параметры во внешнюю систему.", "Запустите внешний сценарий.", "Не дублируйте автоматические переходы в Toolkit."],
    monitoring: procedure.monitoring, result: ["Получите результат и файлы измерений из внешней системы.", ...procedure.result], adapterId: adapter?.id || null };
}
