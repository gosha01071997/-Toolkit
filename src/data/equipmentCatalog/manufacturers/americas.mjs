import { model, source } from "../schema.mjs";
const family = (manufacturer, baseUrl, rows) => rows.map(([name, equipmentType, id, lifecycleStatus = "current"]) => model({ id, manufacturer, model: name, equipmentType, lifecycleStatus, sources: [source(manufacturer, name, `${manufacturer} ${name}`, baseUrl)] }));
export const AMERICAS_MODELS = [
  ...family("Keysight", "https://www.keysight.com/us/en/products.html", [
    ["N9030B PXA", "spectrum_analyzer", "keysight-n9030b"], ["N9000B CXA", "spectrum_analyzer", "keysight-n9000b"],
    ["N5171B EXG", "signal_generator", "keysight-n5171b"], ["E8257D PSG", "signal_generator", "keysight-e8257d"],
    ["33500B Series", "function_generator", "keysight-33500b"], ["InfiniiVision 3000G X-Series", "oscilloscope", "keysight-3000g-x"],
    ["N1914A EPM Series", "power_meter", "keysight-n1914a"], ["N8481A", "power_sensor", "keysight-n8481a"],
  ]),
  ...family("Tektronix", "https://www.tek.com/en/products", [
    ["RSA306B", "spectrum_analyzer", "tektronix-rsa306b"], ["MDO34", "oscilloscope", "tektronix-mdo34"],
    ["AFG31000 Series", "function_generator", "tektronix-afg31000"], ["DMM6500", "multimeter", "tektronix-dmm6500"],
  ]),
  ...family("ETS-Lindgren", "https://www.ets-lindgren.com/products/antennas", [
    ["3142E", "antenna", "ets-3142e"], ["3117", "antenna", "ets-3117"], ["6502", "antenna", "ets-6502"],
    ["91550-1", "current_probe", "ets-91550-1"], ["3186", "field_probe", "ets-3186"],
  ]),
  ...family("Fischer Custom Communications", "https://www.fischercc.com/products/", [
    ["F-33-1", "current_probe", "fcc-f-33-1"], ["F-65", "bci_injection_probe", "fcc-f-65"],
    ["FCC-BCICF-1", "calibration_fixture", "fcc-bcicf-1"], ["F-120-6A", "cdn", "fcc-f-120-6a"],
  ]),
  ...family("Amplifier Research", "https://www.arworld.us/html/amplifiers.asp", [
    ["25W1000G", "power_amplifier", "ar-25w1000g"], ["100A250A", "power_amplifier", "ar-100a250a"], ["250W1000B", "power_amplifier", "ar-250w1000b"],
  ]),
  ...family("Solar Electronics", "https://www.solar-emc.com/products.html", [
    ["9252-50-R-24-BNC", "lisn", "solar-9252-50-r-24-bnc"], ["9354-1", "transformer", "solar-9354-1"], ["6220-1A", "transient_generator", "solar-6220-1a"],
  ]),
  ...family("Com-Power", "https://www.com-power.com/products", [
    ["LI-125A", "lisn", "compower-li-125a"], ["AL-130R", "antenna", "compower-al-130r"], ["PA-103", "preamplifier", "compower-pa-103"], ["CDN-M3-16A", "cdn", "compower-cdn-m3-16a"],
  ]),
  ...family("Empower RF Systems", "https://www.empowerrf.com/products/", [["2203", "power_amplifier", "empower-2203"], ["2198", "power_amplifier", "empower-2198"]]),
];
