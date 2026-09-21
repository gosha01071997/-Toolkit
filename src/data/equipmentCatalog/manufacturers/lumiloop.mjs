import { model, source } from "../schema.mjs";

const url = "https://lumiloop.de/products/";
const lumiloop = (name, equipmentType, id, extra = {}) => model({
  id, manufacturer: "LUMILOOP", model: name, equipmentType,
  verificationStatus: "partially_verified", ...extra,
  sources: [source("LUMILOOP", name, `LUMILOOP ${name}`, url)],
});

export const LUMILOOP_MODELS = [
  lumiloop("LSProbe 1.2", "field_probe", "lumiloop-lsprobe-1-2", {
    subtype: "Изотропный оптоволоконный E-field probe",
    specifications: { probeType: "Изотропный оптоволоконный E-field probe", interface: "Оптоволоконная измерительная система", variants: null, fieldStrengthRange: null, measurement: null },
    applications: ["radiated immunity", "field monitoring"], compatibleAccessories: ["lumiloop-ci-250", "lumiloop-ci-250-plus"],
  }),
  lumiloop("LSProbe 2.0", "field_probe", "lumiloop-lsprobe-2-0", {
    subtype: "Изотропный оптоволоконный E-field probe",
    specifications: { probeType: "Изотропный оптоволоконный E-field probe", interface: "Оптоволоконная измерительная система", variants: null, fieldStrengthRange: null, measurement: null },
    applications: ["radiated immunity", "field monitoring"], compatibleAccessories: ["lumiloop-ci-250", "lumiloop-ci-250-plus"],
  }),
  lumiloop("CI-250", "test_system", "lumiloop-ci-250", { applications: ["Управление и считывание LSProbe"], compatibleAccessories: ["lumiloop-lsprobe-1-2", "lumiloop-lsprobe-2-0"] }),
  lumiloop("CI-250 Plus (CI-250+)", "test_system", "lumiloop-ci-250-plus", { applications: ["Управление и считывание LSProbe"], compatibleAccessories: ["lumiloop-lsprobe-1-2", "lumiloop-lsprobe-2-0"] }),
  lumiloop("LSPM 1.0", "power_meter", "lumiloop-lspm-1-0", { subtype: "Оптоволоконный RF power meter", applications: ["Контроль мощности в поле"] }),
  lumiloop("LSPM 1.1", "power_meter", "lumiloop-lspm-1-1", { subtype: "Оптоволоконный RF power meter", applications: ["Контроль мощности в поле"] }),
  lumiloop("LSPM 2.0", "power_meter", "lumiloop-lspm-2-0", { subtype: "Оптоволоконный RF power meter", applications: ["Контроль мощности в поле"] }),
];
