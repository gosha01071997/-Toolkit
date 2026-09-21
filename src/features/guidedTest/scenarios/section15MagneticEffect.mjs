import { createScenario, normalizeNumber } from "../engine.mjs";
import { calculateControlDeflection, checkFieldUniformity, checkLaboratoryConditions, getMagneticEffectResult, SECTION_15_LIMITS } from "../section15Calculations.mjs";

export const SECTION_15_SETUP_IMAGE = new URL("../assets/section15-setup.svg", import.meta.url).href;
export const SECTION_15_DISTANCE_IMAGE = new URL("../assets/section15-distance.svg", import.meta.url).href;

const numeric = (message, { min = -Infinity, required = true } = {}) => value => {
  if (!required && String(value ?? "").trim() === "") return null;
  const number = normalizeNumber(value);
  return !Number.isFinite(number) || number < min ? message : null;
};
const condition = (id, label, hint) => ({
  id, label, inputMode: "decimal", hint,
  validate: numeric("Введите конечное числовое значение"),
  status: inputs => checkLaboratoryConditions(inputs).checks[id] ? "✓ соответствует" : "⚠ вне стандартных условий",
});
const dc = inputs => { try { return calculateControlDeflection(inputs.h); } catch { return null; } };
const fmt = (value, digits = 2) => value == null ? "—" : value.toLocaleString("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const dcText = inputs => dc(inputs) == null ? "—" : `${fmt(dc(inputs))}°`;

export const section15MagneticEffect = createScenario({
  id: "section-15-magnetic-effect-v1",
  title: "15 — Магнитное воздействие",
  standard: "RTCA DO-160G",
  section: "Раздел 15 — магнитное воздействие",
  description: "Пошаговое определение категории магнитного воздействия изделия по измеренному расстоянию.",
  showStageCompletion: false,
  stageOrder: ["equipment", "magneticField", "setup", "maximumEffect", "distance", "result"],
  equipmentRequirements: [
    { id: "deflectionInstrument", type: "Компас / буссоль", aliases: ["Магнитный датчик", "Другое"], title: "Магнитный индикатор", optional: false, typeChoices: ["Компас / буссоль", "Магнитный датчик / эквивалентное средство"] },
    { id: "magnetometer", type: "Магнитометр", aliases: ["Магнитный датчик"], title: "Чем измеряете магнитное поле?", optional: false, showOnEquipmentStage: false, typeChoices: ["Магнитометр", "Эквивалентное поддерживаемое средство измерения магнитного поля"] },
  ],
  stages: {
    equipment: {
      title: "Подготовьте испытание", showEquipment: true,
      intro: "Укажите изделие и выберите из каталога магнитный индикатор — без него испытание нельзя завершить.",
      canAdvance: (inputs, progress) => Boolean(String(inputs.eutName || "").trim() && progress.equipment.deflectionInstrument),
      blockedMessage: "Укажите изделие и выберите магнитный индикатор из каталога.",
      fields: [
        { id: "eutName", label: "Наименование изделия" },
        { id: "eutModel", label: "Обозначение / модель" },
      ],
    },
    magneticField: {
      title: "Определите магнитное поле", derivedAfterFields: true, showActionCompletion: false,
      equipmentRequirementIds: ["magnetometer"],
      fieldsBeforeActions: ["hKnown"],
      canAdvance: (inputs, progress) => dc(inputs) != null && (inputs.hKnown === "yes" || (inputs.hKnown === "no" && Boolean(progress.equipment.magnetometer))),
      blockedMessage: "Чтобы продолжить, укажите корректное H; если H неизвестна, также выберите средство измерения магнитного поля.",
      actions: [
        { id: "removeEut", visibleWhen: inputs => inputs.hKnown === "no", title: "1. Освободите место измерения", instruction: "Уберите изделие из зоны измерения.", warning: "Уберите телефон, часы и другие магнитные или ферромагнитные предметы от места измерения." },
        { id: "placeMeter", visibleWhen: inputs => inputs.hKnown === "no", title: "2. Расположите магнитометр", instruction: "Расположите магнитометр в месте, где будет находиться магнитный индикатор. Следуйте инструкции выбранного прибора." },
        { id: "measureH", visibleWhen: inputs => inputs.hKnown === "no", title: "3. Измерьте H", instruction: "Измерьте горизонтальную составляющую магнитного поля H и введите полученное значение ниже." },
      ],
      fields: [
        { id: "hKnown", type: "radio", label: "Известна горизонтальная составляющая магнитного поля H в месте проведения испытания?", options: [{ value: "yes", label: "Да, известна" }, { value: "no", label: "Нет, необходимо измерить" }] },
        { id: "h", label: "H, А/м", inputMode: "decimal", visibleWhen: inputs => ["yes", "no"].includes(inputs.hKnown), validate: numeric("H должно быть конечным числом больше 0", { min: Number.MIN_VALUE }) },
        { ...condition("temperature", "Температура, °C", "+15…+35 °C"), group: "Условия в лаборатории" },
        { ...condition("humidity", "Относительная влажность, %", "не более 85 %"), group: "Условия в лаборатории" },
        { ...condition("pressure", "Давление, кПа", "84…107 кПа"), group: "Условия в лаборатории" },
      ],
      notices: [
        { tone: "warning", visibleWhen: inputs => !checkLaboratoryConditions(inputs).ok, text: "Фактические лабораторные условия выходят за стандартный диапазон. Зафиксируйте их в результате." },
      ],
      derivedVisibleWhen: inputs => dc(inputs) != null,
      derived: [
        { label: "Магнитное поле", value: inputs => `H = ${fmt(normalizeNumber(inputs.h))} А/м` },
        { label: "Контрольное отклонение", value: inputs => `Dc = ${fmt(dc(inputs))}°`, prominent: true },
        { value: inputs => { const h = normalizeNumber(inputs.h); return h >= SECTION_15_LIMITS.hMin && h <= SECTION_15_LIMITS.hMax ? "Поле находится в опорном диапазоне 14,4 А/м ±10 %." : "Dc скорректировано автоматически с учётом измеренного H."; } },
      ],
    },
    setup: {
      title: "Соберите установку", showActionCompletion: false,
      actions: [
        { id: "placeIndicator", title: "1. Установите магнитный индикатор", instruction: "Установите магнитный индикатор на немагнитной поверхности и сориентируйте его ось по направлению Север — Юг." },
        { id: "placeEut", title: "2. Расположите изделие", instruction: "Расположите выключенное изделие согласно схеме на немагнитных опорах." },
        { id: "placeHarness", title: "3. Расположите жгут", instruction: "Расположите жгут по линии Запад — Восток через ось магнитного элемента или индикатора согласно методике." },
        { id: "clearArea", title: "4. Освободите зону", instruction: "Используйте немагнитные опоры и уберите влияющие магнитные и ферромагнитные предметы." },
      ],
      diagram: { title: "Схема установки", image: SECTION_15_SETUP_IMAGE, alt: "Изделие, испытательный жгут и магнитный индикатор на немагнитных опорах", description: "D измеряется от оси магнитного индикатора до ближайшей части изделия.", enlargeLabel: "Открыть схему крупнее" },
      photos: true,
    },
    maximumEffect: {
      title: "Найдите худший режим", showActionCompletion: false,
      derived: [{ label: "Ищем отклонение", value: inputs => dc(inputs) == null ? "—" : `${fmt(dc(inputs))}°`, prominent: true }],
      actions: [
        { id: "turnOnEut", title: "1. Включите изделие", instruction: "Переведите изделие в рабочее состояние." },
        { id: "selectMode", title: "2. Проверьте рабочие режимы", instruction: "Если режимов несколько, последовательно включите их и оставьте режим, при котором воздействие на магнитный индикатор максимально." },
        { id: "selectOrientation", title: "3. Найдите ориентацию изделия", instruction: "Изменяйте ориентацию изделия, сохраняя требуемое положение жгута. Остановитесь в положении, вызывающем максимальное отклонение магнитного индикатора." },
      ],
      fields: [{ id: "maximumMode", label: "Режим изделия при максимальном воздействии", hint: "Необязательно; сохраните его для воспроизведения установки" }],
    },
    distance: {
      title: "Найдите расстояние D", showActionCompletion: false,
      canAdvance: inputs => inputs.reachesDc === "no" || (inputs.reachesDc === "yes" && normalizeNumber(inputs.distance) > 0 && Boolean(inputs.distanceUnit)),
      blockedMessage: "Ответьте, достигнуто ли Dc. Если да — выберите единицу и введите измеренное расстояние D.",
      derived: [{ label: "КОНТРОЛЬНОЕ ОТКЛОНЕНИЕ", value: inputs => dc(inputs) == null ? "Dc = —" : `Dc = ${fmt(dc(inputs))}°`, prominent: true }],
      fieldsBeforeActions: ["method", "uniformity"],
      actions: [
        { id: "eutKeep", visibleWhen: inputs => inputs.method === "eut", title: "1. Сохраните режим и ориентацию", instruction: "Сохраните найденные ранее режим работы и ориентацию изделия." },
        { id: "eutStart", visibleWhen: inputs => inputs.method === "eut", title: "2. Разместите изделие достаточно далеко", instruction: "Разместите изделие достаточно далеко, чтобы контрольное отклонение Dc не было достигнуто." },
        { id: "eutMove", visibleWhen: inputs => inputs.method === "eut", title: "3. Приближайте изделие", instruction: "Медленно приближайте изделие к магнитному индикатору." },
        { id: "eutWatch", visibleWhen: inputs => inputs.method === "eut", title: "4. Следите за отклонением", instruction: "Наблюдайте за отклонением магнитного индикатора во время перемещения." },
        { id: "eutStop", visibleWhen: inputs => inputs.method === "eut", title: "5. Остановите изделие", instruction: inputs => `Остановитесь, когда отклонение достигнет контрольного значения Dc = ${dcText(inputs)}.` },
        { id: "sensorKeep", visibleWhen: inputs => inputs.method === "sensor", title: "1. Сохраните режим и ориентацию", instruction: "Сохраните найденные ранее режим работы и ориентацию изделия. Оставьте изделие неподвижным." },
        { id: "sensorStart", visibleWhen: inputs => inputs.method === "sensor", title: "2. Отведите индикатор", instruction: "Начните с положения, в котором магнитный индикатор удалён от изделия." },
        { id: "sensorMove", visibleWhen: inputs => inputs.method === "sensor", title: "3. Перемещайте индикатор", instruction: "Медленно приближайте магнитный индикатор к неподвижному изделию по проверенной траектории." },
        { id: "sensorWatch", visibleWhen: inputs => inputs.method === "sensor", title: "4. Следите за отклонением", instruction: "Наблюдайте за отклонением магнитного индикатора во время перемещения." },
        { id: "sensorStop", visibleWhen: inputs => inputs.method === "sensor", title: "5. Остановите индикатор", instruction: inputs => `Остановитесь, когда отклонение достигнет контрольного значения Dc = ${dcText(inputs)}.` },
      ],
      fields: [
        { id: "method", type: "radio", label: "Метод проведения", options: [{ value: "eut", label: "Перемещаем изделие относительно магнитного индикатора" }, { value: "sensor", label: "Перемещаем магнитный индикатор относительно изделия" }] },
        { id: "uniformity", label: "Максимальное изменение показаний вдоль траектории, °", hint: "До установки изделия переместите магнитный индикатор по всей будущей траектории. Допустимо не более ±0,5°.", inputMode: "decimal", visibleWhen: inputs => inputs.method === "sensor", validate: numeric("Введите конечное числовое значение"), status: inputs => checkFieldUniformity(inputs.uniformity).invalid ? "" : checkFieldUniformity(inputs.uniformity).ok ? "✓ Однородность поля достаточна." : "⚠ Изменение поля превышает ±0,5°. Выберите подходящее место и устраните влияние магнитных объектов." },
        { id: "reachesDc", type: "radio", label: inputs => `Удалось получить отклонение Dc = ${dcText(inputs)}?`, options: [{ value: "yes", label: "Да" }, { value: "no", label: "Нет, Dc не достигается даже при минимально возможном расстоянии" }] },
        { id: "distanceUnit", type: "radio", label: "Единица измерения D", options: [{ value: "cm", label: "Сантиметры" }, { value: "m", label: "Метры" }], visibleWhen: inputs => inputs.reachesDc === "yes" },
        { id: "distance", label: inputs => `D, ${inputs.distanceUnit === "m" ? "м" : "см"}`, inputMode: "decimal", hint: "Не перемещайте установку. Измерьте D от оси магнитного элемента или индикатора до ближайшей части изделия.", visibleWhen: inputs => inputs.reachesDc === "yes", validate: numeric("D должно быть конечным числом больше 0", { min: Number.MIN_VALUE }) },
        { id: "testNotes", label: "Заметки по результату", hint: "Необязательно", visibleWhen: inputs => ["yes", "no"].includes(inputs.reachesDc) },
      ],
      diagram: { title: "Как измерить D", image: SECTION_15_DISTANCE_IMAGE, alt: "Расстояние D от оси магнитного индикатора до ближайшей части изделия", description: "Не перемещайте установку после достижения Dc." },
      measurementResult: inputs => inputs.reachesDc === "no" || (inputs.reachesDc === "yes" && normalizeNumber(inputs.distance) > 0) ? getMagneticEffectResult(inputs) : null,
    },
    result: {
      title: "Результат",
      result: (inputs, progress = { equipment: {} }) => { const result = getMagneticEffectResult(inputs); return result && progress.equipment.deflectionInstrument ? { ...result, conditions: checkLaboratoryConditions(inputs), uniformity: inputs.method === "sensor" ? checkFieldUniformity(inputs.uniformity) : null } : null; },
    },
  },
});
