/**
 * Нормативные числовые последовательности пока не подтверждены проверенной
 * базой проекта. null означает явный TODO, а не предполагаемое значение.
 */
export const SECTION_16_PROFILE = Object.freeze({
  id: "section16-project-profile-v1", title: "Раздел 16 — профиль проекта",
  source: null, verificationStatus: "requires-source-verification",
  TODO: "Заполнить классы питания, категории, уровни и длительности после проверки первичного нормативного источника.",
  dcNominalClasses: [], acNetworkOptions: [], parameters: Object.freeze({
    voltageSequence: null, rippleProfile: null, interruptionSequence: null,
    transientProfile: null, startingProfile: null, abnormalProfile: null,
  }),
  applicabilityRules: Object.freeze([
    { procedureId: "steadyVoltage", powerTypes: ["DC", "AC"] },
    { procedureId: "interruption", powerTypes: ["DC", "AC"] },
    { procedureId: "transient", powerTypes: ["DC", "AC"] },
    { procedureId: "starting", powerTypes: ["DC", "AC"] },
    { procedureId: "abnormal", powerTypes: ["DC", "AC"] },
    { procedureId: "ripple", powerTypes: ["DC"] },
  ]),
});
