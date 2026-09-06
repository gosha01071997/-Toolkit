const LEGACY_TEST_NAMES = {
  "Conducted Emissions": "Кондуктивная эмиссия / помехоэмиссия",
  "Radiated Emissions": "Излучаемая эмиссия",
  "Conducted Immunity": "Устойчивость к кондуктивным помехам",
  "Radiated Immunity": "Устойчивость к излучаемым помехам",
  "Инжекция тока": "Инжекция тока",
  ESD: "Электростатический разряд",
  "EFT/Burst": "Наносекундные импульсные помехи / EFT/Burst",
  Surge: "Импульс большой энергии / Surge",
  PFMF: "Магнитное поле промышленной частоты",
  "Voltage Dips": "Провалы и прерывания напряжения",
};

export const journalDisplayName = test => {
  if (test.catalogGroup === "kt160g") return `КТ-160Г, разд. ${String(test.short || "").replace(/^п\./, "")} — ${test.name || "Без названия"}`;
  return `${test.short || test.section || "Без номера"} — ${test.name || "Без названия"}`;
};

export const KT160G_SECTIONS = [
  ["15", "Магнитное воздействие"],
  ["16", "Электропитание"],
  ["17", "Выбросы напряжения"],
  ["18", "Восприимчивость к кондуктивным помехам звуковой частоты по цепям электропитания"],
  ["19", "Восприимчивость к индуцированным сигналам"],
  ["20", "Радиочастотная восприимчивость"],
  ["20.4", "Радиочастотная восприимчивость — помехи проводимости"],
  ["20.5", "Радиочастотная восприимчивость — помехи излучению"],
  ["21", "Излучение (генерация) радиочастотной энергии"],
  ["21.4", "Радиочастотная восприимчивость — помехи проводимости"],
  ["25", "Электростатический разряд"],
].map(([section, name]) => ({
  id: `kt160g-${section.replace(".", "-")}`,
  short: `п.${section}`,
  name,
  title: `Раздел ${section} — ${name}`,
  standard: `КТ-160Г, раздел ${section}`,
  catalogGroup: "kt160g",
  range: "Не заполнено",
  desc: "Данные пока не заполнены. Откройте редактирование, чтобы внести сведения вручную.",
  normDoc: "КТ-160Г",
  criteria: "",
  setup: [], steps: [], before: [], during: [], after: [], notes: "",
  placeholder: true,
}));

export const hasCompletedAllSteps = (steps = [], completed = 0) => steps.length > 0 && completed === steps.length;

export function buildTestCatalog(builtIns = [], custom = [], overrides = {}) {
  return [...builtIns.map(test => ({ ...test, ...(overrides[test.id] || {}) })), ...custom]
    .filter(test => test && test.id && !test.deleted);
}

export function buildJournalTestOptions(catalog = []) {
  return catalog.map(test => ({ testId: test.id, section: test.short || "", testName: test.name || "", displayValue: journalDisplayName(test) }));
}

export function migrateJournalEntry(entry = {}, catalog = []) {
  if (entry.testId && entry.section && entry.testName) {
    return { ...entry, displayValue: entry.displayValue || `${entry.section} — ${entry.testName}` };
  }
  const legacy = String(entry.testType || "");
  const legacyLabel = LEGACY_TEST_NAMES[legacy] || legacy;
  const match = catalog.find(test => [test.id, test.short, test.name, journalDisplayName(test)].includes(legacy));
  return {
    ...entry,
    testId: match?.id || `legacy:${legacy || "unknown"}`,
    section: match?.short || "",
    testName: match?.name || legacyLabel || "Неизвестный тип испытания",
    displayValue: match ? journalDisplayName(match) : legacyLabel || "Неизвестный тип испытания",
  };
}

export function snapshotJournalSelection(entry, option) {
  return { ...entry, testId: option.testId, section: option.section, testName: option.testName, displayValue: option.displayValue, testType: option.testId };
}

export function createEquipmentPatch(draft = {}) {
  return {
    name: String(draft.name || ""), type: String(draft.type || "Другое"), arm: String(draft.arm || ""),
    desc: String(draft.desc || ""), specs: Array.isArray(draft.specs) ? draft.specs : draft.specs || "",
    photo: String(draft.photo || ""), icon: String(draft.icon || "🔧"),
    ...(draft.antennaProfile ? { antennaProfile: draft.antennaProfile } : {}),
  };
}
