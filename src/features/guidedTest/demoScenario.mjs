import { createScenario } from "./engine.mjs";

export const demoScenario = createScenario({
  id: "guided-demo-v1", title: "Демонстрация пошагового испытания", standard: "Технический DEMO-сценарий", section: "Без нормативных значений",
  description: "Проверка возможностей пошагового движка. Значения и расчёт ниже не являются требованиями какого-либо стандарта.",
  categories: ["Демонстрация"], objectVariants: ["Учебный объект"],
  equipmentRequirements: [{ id: "generator", type: "Генератор", title: "Генератор", optional: false }],
  warnings: ["Используйте этот сценарий только для знакомства с интерфейсом."],
  stages: {
    conditions: { fields: [{ id: "environment", label: "Условия в помещении", placeholder: "Введите условия" }] },
    equipment: {},
    preparation: { actions: [{ id: "inspect", title: "Осмотрите учебный объект", instruction: "Убедитесь, что объект подготовлен и безопасно отключён перед сборкой.", explanation: "Отметьте действие после визуального осмотра." }] },
    diagram: { diagram: { title: "Схема испытания", description: "Генератор → кабель → учебный объект", labels: ["Генератор", "Кабель", "Учебный объект"] } },
    settings: { fields: [{ id: "source", label: "Исходное тестовое значение", unit: "усл. ед.", type: "number" }] },
    calibration: { required: false },
    procedure: { actions: [{ id: "measure", title: "Выполните тестовое измерение", instruction: "Введите два учебных значения в таблицу и проверьте автоматический расчёт.", warning: "Это демонстрационный расчёт, а не нормативная формула." }], tables: [{ id: "demo-results", title: "Учебные результаты", columns: [{ key: "point", title: "Точка" }, { key: "measured", title: "Измерено" }, { key: "doubled", title: "Тестовый результат", readonly: true, calculate: row => { const n = Number(String(row.measured || "").replace(",", ".")); return Number.isFinite(n) ? n * 2 : ""; } }] }] },
    result: { title: "Результат", fields: [{ id: "conclusion", label: "Итог испытания", placeholder: "Введите итог" }] },
  },
  calculations: { double: values => Number(String(values.value || "").replace(",", ".")) * 2 },
});
