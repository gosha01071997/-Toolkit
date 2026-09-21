import { model, source } from "../schema.mjs";

const official = (manufacturer, name, equipmentType, id, url, extra = {}) => model({
  id, manufacturer, model: name, equipmentType,
  verificationStatus: "partially_verified",
  sources: [source(manufacturer, name, `${manufacturer}: ${name}`, url, "official_product_page")],
  ...extra,
});

// The records below deliberately keep undocumented values null.  A family is a
// catalog record only where the manufacturer itself markets that name as a family.
const gcmo = "https://www.scemc.ru/";
export const GCMO_MODELS = [
  ...[
    ["РА-00140 family", "gcmo-ra-00140"], ["РА-0810 family", "gcmo-ra-0810"],
    ["РА-1060 family", "gcmo-ra-1060"], ["РА-06180 family", "gcmo-ra-06180"],
    ["РА-0730 family", "gcmo-ra-0730"], ["WA-002025-60C", "gcmo-wa-002025-60c"],
    ["WA-0210-60C", "gcmo-wa-0210-60c"],
  ].map(([name, id]) => official("ГЦМО ЭМС", name, "power_amplifier", id, gcmo, { applications: ["radiated immunity", "conducted immunity"] })),
  official("ГЦМО ЭМС", "KA22-3S4", "rf_switch", "gcmo-ka22-3s4", gcmo, { applications: ["Автоматизированная коммутация испытательного тракта"] }),
  official("ГЦМО ЭМС", "ИППГ 20", "power_meter", "gcmo-ippg-20", gcmo, { applications: ["Контроль проходящей мощности"] }),
  official("ГЦМО ЭМС", "ПЛ-0980-1510-1000", "tem_cell", "gcmo-pl-0980-1510-1000", gcmo, { applications: ["Испытания на устойчивость к излучаемому полю"] }),
  official("ГЦМО ЭМС", "ТЕМ-1218-500", "tem_cell", "gcmo-tem-1218-500", gcmo, { applications: ["TEM-испытания"] }),
  official("ГЦМО ЭМС", "ИЛ 0110-2", "test_fixture", "gcmo-il-0110-2", gcmo, { applications: ["Испытательная оснастка"] }),
  official("ГЦМО ЭМС", "МА series", "antenna", "gcmo-ma-series", gcmo, { applications: ["Измерение магнитного поля"] }),
  official("ГЦМО ЭМС", "ИГМП", "magnetic_field_generator", "gcmo-igmp", gcmo, { applications: ["Испытания магнитным полем"] }),
  official("ГЦМО ЭМС", "ИГНЧ family", "signal_generator", "gcmo-ignch-family", gcmo, { applications: ["Низкочастотные испытательные воздействия"] }),
];

const scard = "https://skard.ru/";
export const SCARD_MODELS = [
  ["П6-522М", "skard-p6-522m"], ["П6-223N", "skard-p6-223n"], ["П6-160", "skard-p6-160"],
  ["П6-421", "skard-p6-421"], ["П6-124", "skard-p6-124"],
].map(([name, id]) => official("СКАРД", name, "antenna", id, scard, { applications: ["radiated emissions", "radiated immunity"] }));

const pristGenerators = "https://prist.ru/productions/generatory-signalov/";
const pristAnalyzers = "https://prist.ru/productions/analizatory-spektra/";
const pristScopes = "https://prist.ru/productions/oscillografy/";
const pristPower = "https://prist.ru/productions/istochniki-pitaniya/";
const pristLoads = "https://prist.ru/productions/elektronnye-nagruzki/";
const akip = (name, type, url) => official("АКИП", name, type, `akip-${name.toLowerCase().replace("акіп-", "").replace("акип-", "").replaceAll("/", "-").replaceAll(" ", "-")}`, url, { applications: ["Измерительный и испытательный тракт ЭМС"] });
export const AKIP_EXPANDED_MODELS = [
  ...["АКИП-3202", "АКИП-3203", "АКИП-3204", "АКИП-3205", "АКИП-3206", "АКИП-3207", "АКИП-3211", "АКИП-3212", "АКИП-3213"].map(name => akip(name, "signal_generator", pristGenerators)),
  ...["АКИП-4202", "АКИП-4203", "АКИП-4204", "АКИП-4205", "АКИП-4206", "АКИП-4207", "АКИП-4208"].map(name => akip(name, "spectrum_analyzer", pristAnalyzers)),
  ...["АКИП-4115", "АКИП-4122", "АКИП-4131", "АКИП-4133", "АКИП-4135"].map(name => akip(name, "oscilloscope", pristScopes)),
  ...["АКИП-1101", "АКИП-1103", "АКИП-1104", "АКИП-1115", "АКИП-1125", "АКИП-1142", "АКИП-1144"].map(name => akip(name, "dc_power_supply", pristPower)),
  ...["АКИП-1301", "АКИП-1302", "АКИП-1303", "АКИП-1304"].map(name => akip(name, "electronic_load", pristLoads)),
  ...["АКИП-3413/1", "АКИП-3413/2", "АКИП-3415", "АКИП-3420"].map(name => akip(name, "function_generator", "https://prist.ru/productions/generatory-signalov-proizvolnoy-formy/")),
  ...["АКИП-5102", "АКИП-5103", "АКИП-5104"].map(name => akip(name, "frequency_counter", "https://prist.ru/productions/chastotomery/")),
  ...["АКИП-2401", "АКИП-2402", "АКИП-2403", "АКИП-2404"].map(name => akip(name, "multimeter", "https://prist.ru/productions/multimetry/")),
];

export const RUSSIA_CIS_MODELS = [...GCMO_MODELS, ...SCARD_MODELS, ...AKIP_EXPANDED_MODELS];
