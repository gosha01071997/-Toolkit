export const P204_PROGRESS_KEY = "emc_test_progress_p204_v1";

const frequenciesMHz = [0.01, 0.5, 1, 30, 40, 100, 400];
const categoryValues = {
  M: [0.6, 30, 70, 70, null, null, 32],
  O: [3, 150, 250, 250, null, null, 50],
  R: [0.6, 30, 30, 30, 30, null, 3],
  S: [0.03, 1.5, 1.5, 1.5, 1.5, null, 0.15],
  T: [0.15, 7.5, 7.5, 7.5, 7.5, null, 0.75],
  W: [3, 150, 150, 150, 150, null, 32],
  Y: [6, 300, 300, 300, 300, 300, 100],
};

const preparationSteps = [
  "Выбрать категорию испытания.", "Определить испытываемый кабельный жгут.",
  "Проверить состав и подключение испытательного тракта.", "Установить инжекционный пробник на испытываемый жгут.",
  "Установить измерительный токовый пробник.", "Подключить генератор и усилитель к инжекционному тракту.",
  "Подключить контроль измерительного уровня.", "Включить ИРИ и перевести его в контролируемый рабочий режим.",
  "Зафиксировать исходную работоспособность ИРИ.",
].map((text, index) => ({ id: `prepare-${index + 1}`, text }));

const procedureSteps = [
  "Установить начальную частоту испытания.", "Подать РЧ-сигнал на инжекционный тракт.",
  "Контролировать ток, наведённый в испытываемом жгуте.",
  "Увеличивать воздействие до требуемого уровня выбранной категории, не выходя за ограничения испытательного тракта.",
  "Контролировать работоспособность ИРИ во время воздействия.",
  "Выполнить прохождение требуемого частотного диапазона согласно программе испытаний.",
  "Фиксировать частоты, на которых обнаружены отклонения в работе ИРИ.",
  "После воздействия проверить восстановление и работоспособность ИРИ.",
].map((text, index) => ({ id: `conduct-${index + 1}`, phase: "Проведение", text }));

const requiredEquipmentRoles = [
  ["rf-generator", "Генератор РЧ-сигнала"], ["power-amplifier", "Усилитель мощности"],
  ["directional-coupler", "Направленный ответвитель / контроль мощности"], ["bci-probe", "Инжекционный пробник BCI"],
  ["current-probe", "Токовый контрольный / измерительный пробник"], ["level-meter", "Измерительный приёмник / измеритель уровня"],
  ["eut", "ИРИ / EUT"], ["cable-harness", "Кабельный жгут"], ["ground-plane", "Опорная плоскость заземления"],
].map(([id, label]) => ({ id, label }));

const makeCategory = id => ({
  id, label: id,
  referencePoints: frequenciesMHz.map((frequencyMHz, index) => ({
    frequencyMHz, value: categoryValues[id][index], unit: "mA", curveDefined: categoryValues[id][index] === null,
  })),
  preparationSteps, procedureSteps, requiredEquipmentRoles,
});

export const P204_MODEL = Object.freeze({
  id: "p204",
  title: "РЧ-восприимчивость — помехи проводимости",
  description: "Проверяется устойчивость изделия к радиочастотной помехе, вводимой в кабельный жгут через инжекционный пробник (BCI). Во время воздействия контролируется наведённый ток и работоспособность изделия.",
  method: "BCI / ввод радиочастотной помехи в кабельный жгут",
  range: { startMHz: 0.01, endMHz: 400, display: "10 kHz – 400 MHz" },
  controlledQuantity: "наведённый ток в испытываемом жгуте",
  categoryNote: "Для п.20.4 используется первый символ категории раздела 20.",
  categories: Object.keys(categoryValues).map(makeCategory), commonSteps: [], calculations: [],
  metadata: {
    sourceNotes: [
      "КТ-160G / 14G, Section 20 — 20.4 Conducted Susceptibility.",
      "Категории M/O/R/S/T/W/Y и опорные уровни относятся к структуре КТ-160G / DO-160G Section 20.",
      "Связанный российский нормативный документ: ГОСТ РВ 6601-001-2008 «Оборудование бортовое авиационное. Общие требования к восприимчивости при воздействии электромагнитных помех и методики измерения».",
    ],
  },
});

export const createP204Progress = (value = {}) => ({ version: 1, selectedCategoryId: null, categoryRevision: 0, userValues: {}, equipmentAssignments: {}, checklist: {}, completedSteps: {}, currentStep: 0, observations: { initial: "", during: "", deviation: "", comment: "" }, currentFrequency: { value: "", unit: "MHz" }, measuredCurrent: "", eutState: "not-assessed", eutComment: "", deviationEvents: [], stepResults: {}, result: "incomplete", ...value });
export function selectP204Category(progress, categoryId, model = P204_MODEL) { if (!model.categories.some(c => c.id === categoryId) || progress.selectedCategoryId === categoryId) return progress; return createP204Progress({ ...progress, selectedCategoryId: categoryId, categoryRevision: (progress.categoryRevision || 0) + 1, userValues: {}, equipmentAssignments: {}, completedSteps: {}, currentStep: 0 }); }
export const updateP204Progress = (progress, patch) => createP204Progress({ ...progress, ...patch });
export function loadP204Progress(storage) { try { const value = JSON.parse(storage?.getItem(P204_PROGRESS_KEY) || "null"); return createP204Progress(value && typeof value === "object" ? value : {}); } catch { return createP204Progress(); } }
export function saveP204Progress(storage, progress) { const value = createP204Progress(progress); storage?.setItem(P204_PROGRESS_KEY, JSON.stringify(value)); return value; }
export function resetP204Progress(storage) { const value = createP204Progress(); storage?.setItem(P204_PROGRESS_KEY, JSON.stringify(value)); return value; }
export const getP204Category = (progress, model = P204_MODEL) => model.categories.find(c => c.id === progress.selectedCategoryId) || null;
export const getP204Steps = (progress, model = P204_MODEL, userSteps = []) => [...(model.commonSteps || []), ...(getP204Category(progress, model)?.procedureSteps || []), ...(userSteps || [])].map((step, index) => ({ ...step, id: step.id || `user-${index}`, n: index + 1 }));
export function normalizeP204Frequency(value, unit = "MHz") { const number = Number(String(value).replace(",", ".")); if (!Number.isFinite(number) || number < 0) return null; const factor = unit === "kHz" ? 0.001 : unit === "Hz" ? 0.000001 : unit === "GHz" ? 1000 : 1; return number * factor; }
export function findP204ReferencePoint(categoryId, value, unit = "MHz", model = P204_MODEL) { const frequencyMHz = normalizeP204Frequency(value, unit); if (frequencyMHz === null) return null; const category = model.categories.find(item => item.id === categoryId); return category?.referencePoints.find(point => Math.abs(point.frequencyMHz - frequencyMHz) < 1e-9) || null; }
