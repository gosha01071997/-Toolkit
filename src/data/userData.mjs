export const EQUIPMENT_TYPES = ["Генератор", "Усилитель", "Аттенюатор", "Антенна", "Инжектор / BCI probe", "Токовый пробник", "Анализатор / измерительный приёмник", "LISN", "CDN", "Кабель / тракт", "Вспомогательное оборудование", "Другое"];

export const renumberSteps = (steps = []) => steps.map((step, index) => ({ ...step, n: index + 1 }));

export function addStep(steps = [], step = {}) {
  const text = String(step.text || "").trim();
  if (!text) return renumberSteps(steps);
  return renumberSteps([...steps, { ...step, text }]);
}

export function updateStep(steps = [], index, patch = {}) {
  if (index < 0 || index >= steps.length) return renumberSteps(steps);
  return renumberSteps(steps.map((step, i) => i === index ? { ...step, ...patch } : step));
}

export function removeStep(steps = [], index) {
  if (index < 0 || index >= steps.length) return renumberSteps(steps);
  return renumberSteps(steps.filter((_, i) => i !== index));
}

export function moveStep(steps, from, to) {
  if (!Array.isArray(steps) || from < 0 || to < 0 || from >= steps.length || to >= steps.length) return renumberSteps(steps || []);
  const next = [...steps];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return renumberSteps(next);
}

export function createUserTest(fields = {}, now = Date.now()) {
  return {
    id: `user_test_${now}`, custom: true, short: fields.short || "Без номера",
    name: fields.name || "Новое испытание", standard: fields.standard || "Пользовательский стандарт",
    desc: fields.desc || "", range: fields.range || "Не задано", setup: fields.setup || [],
    steps: renumberSteps(fields.steps || []), before: fields.before || [], during: fields.during || [],
    after: fields.after || [], schemaImage: fields.schemaImage || "", notes: fields.notes || "",
  };
}
export const deleteUserTest = (tests, id) => (tests || []).filter(test => !(test.custom && test.id === id));

export function migrateEquipmentItem(item = {}) {
  const type = typeof item.type === "string" && item.type.trim() ? item.type : "Другое";
  return { ...item, type, icon: typeof item.icon === "string" && item.icon ? item.icon : "🔧" };
}
