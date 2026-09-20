import { createScenario, normalizeNumber } from "../engine.mjs";
import { calculateControlDeflection, checkFieldUniformity, checkLaboratoryConditions, getMagneticEffectResult, SECTION_15_LIMITS } from "../section15Calculations.mjs";

export const SECTION_15_SETUP_IMAGE = new URL("../assets/section15-setup.svg", import.meta.url).href;

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
    { id: "magnetometer", type: "Магнитометр", aliases: ["Другое"], title: "Магнитометр — понадобится, если H неизвестна", optional: true },
  ],
  stages: {
    equipment: {
      title: "Подготовьте оборудование", showEquipment: true,
      intro: "Выберите магнитный индикатор. Если поле H в месте испытания неизвестно, подготовьте и выберите также магнитометр.",
      fields: [
        { id: "eutName", label: "Наименование изделия" },
        { id: "eutModel", label: "Обозначение / модель" },
        { id: "eutMode", label: "Режим работы", hint: "Необязательно" },
        { id: "eutNote", label: "Примечание", hint: "Необязательно" },
      ],
    },
    magneticField: {
      title: "Определите магнитное поле", derivedAfterFields: true,
      fields: [
        { id: "hKnown", type: "radio", label: "Известна горизонтальная составляющая магнитного поля H в месте проведения испытания?", options: [{ value: "yes", label: "Да, известна" }, { value: "no", label: "Нет, необходимо измерить" }] },
        { id: "h", label: "H, А/м", inputMode: "decimal", visibleWhen: inputs => ["yes", "no"].includes(inputs.hKnown), validate: numeric("H должно быть конечным числом больше 0", { min: Number.MIN_VALUE }) },
        condition("temperature", "Температура, °C", "+15…+35 °C"),
        condition("humidity", "Относительная влажность, %", "не более 85 %"),
        condition("pressure", "Давление, кПа", "84…107 кПа"),
      ],
      notices: [
        { visibleWhen: inputs => inputs.hKnown === "no", text: "Измерьте горизонтальную составляющую магнитного поля в месте проведения испытания с помощью выбранного магнитометра и внесите полученное значение H." },
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
        { id: "prepareEut", title: "1. Подготовьте изделие к работе", instruction: "Подключите необходимые цепи питания и кабели, но пока не включайте изделие." },
        { id: "prepareHarness", title: "2. Соберите испытательный жгут", instruction: "Используйте кабельный жгут, соответствующий проверяемой конфигурации изделия. Кабели изделия и необходимые провода питания соберите в эту конфигурацию." },
        { id: "placeHarness", title: "3. Расположите жгут", instruction: "Направьте жгут относительно магнитного индикатора так, как показано на схеме, и сохраняйте это положение при последующем повороте изделия." },
        { id: "placeEquipment", title: "4. Установите изделие и индикатор", instruction: "Поставьте изделие и магнитный индикатор на немагнитные опоры согласно схеме. Уберите поблизости посторонние магнитные и ферромагнитные предметы." },
      ],
      diagram: { title: "Схема установки", image: SECTION_15_SETUP_IMAGE, alt: "Изделие, испытательный жгут и магнитный индикатор на немагнитных опорах", description: "D измеряется от оси магнитного индикатора до ближайшей части изделия.", enlargeLabel: "Открыть схему крупнее" },
      photos: true,
    },
    maximumEffect: {
      title: "Найдите максимальное воздействие", showActionCompletion: false,
      derived: [{ label: "Контрольное отклонение", value: inputs => dc(inputs) == null ? "Dc = —" : `Dc = ${fmt(dc(inputs))}°`, prominent: true }],
      actions: [
        { id: "turnOnEut", title: "1. Включите изделие", instruction: "Переведите изделие в рабочее состояние." },
        { id: "selectMode", title: "2. Проверьте рабочие режимы", instruction: "Если режимов несколько, последовательно включите их и оставьте режим, при котором воздействие на магнитный индикатор максимально." },
        { id: "selectOrientation", title: "3. Найдите ориентацию изделия", instruction: "Изменяйте ориентацию изделия, сохраняя требуемое положение жгута. Остановитесь в положении, вызывающем максимальное отклонение магнитного индикатора." },
      ],
      fields: [{ id: "maximumMode", label: "Режим изделия при максимальном воздействии", hint: "Необязательно; сохраните его для воспроизведения установки" }],
    },
    distance: {
      title: "Определите расстояние D", showActionCompletion: false,
      derived: [{ label: "КОНТРОЛЬНОЕ ОТКЛОНЕНИЕ", value: inputs => dc(inputs) == null ? "Dc = —" : `Dc = ${fmt(dc(inputs))}°`, prominent: true }],
      actions: [{ id: "adjustDistance", title: "Изменяйте расстояние", instruction: "Изменяйте расстояние между изделием и магнитным индикатором, сохраняя найденные ранее режим работы и ориентацию изделия. Найдите положение, при котором отклонение магнитного индикатора достигает Dc." }],
      fields: [
        { id: "method", type: "radio", label: "Метод проведения", options: [{ value: "eut", label: "Перемещаем изделие относительно магнитного индикатора" }, { value: "sensor", label: "Перемещаем магнитный индикатор относительно изделия" }] },
        { id: "uniformity", label: "Максимальное изменение показаний вдоль траектории, °", hint: "Допустимо не более ±0,5°", inputMode: "decimal", visibleWhen: inputs => inputs.method === "sensor", validate: numeric("Введите конечное числовое значение"), status: inputs => checkFieldUniformity(inputs.uniformity).invalid ? "" : checkFieldUniformity(inputs.uniformity).ok ? "✓ Однородность поля достаточна." : "⚠ Изменение поля превышает ±0,5°. Выберите подходящее место и устраните влияние магнитных объектов." },
        { id: "reachesDc", type: "radio", label: "Достигается ли контрольное отклонение Dc при приближении изделия к магнитному индикатору?", options: [{ value: "yes", label: "Да" }, { value: "no", label: "Нет, Dc не достигается даже при минимальном расстоянии" }] },
        { id: "distance", label: "D, м", inputMode: "decimal", hint: "Измерьте от оси магнитного индикатора до ближайшей части изделия.", visibleWhen: inputs => inputs.reachesDc === "yes", validate: numeric("D должно быть конечным числом больше 0", { min: Number.MIN_VALUE }) },
      ],
      notices: [{ visibleWhen: inputs => inputs.method === "sensor", text: "До установки изделия переместите магнитный индикатор по всей будущей траектории и убедитесь, что изменение фоновых показаний не превышает ±0,5°." }],
      measurementResult: inputs => inputs.reachesDc === "no" || (inputs.reachesDc === "yes" && normalizeNumber(inputs.distance) > 0) ? getMagneticEffectResult(inputs) : null,
    },
    result: {
      title: "Итог", photos: true,
      result: inputs => { const result = getMagneticEffectResult(inputs); return result && { ...result, conditions: checkLaboratoryConditions(inputs), uniformity: inputs.method === "sensor" ? checkFieldUniformity(inputs.uniformity) : null }; },
    },
  },
});
