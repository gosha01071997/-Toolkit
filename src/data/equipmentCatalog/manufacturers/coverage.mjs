import { model, source } from "../schema.mjs";

// Third-pass gap closure. A row names only a product explicitly listed by its
// manufacturer; unknown characteristics intentionally remain null.
const official = (manufacturer, url, rows) => rows.map(([name, equipmentType, id, extra = {}]) => model({
  id, manufacturer, model: name, equipmentType, ...extra,
  sources: [source(manufacturer, name, `${manufacturer} ${name}`, url, extra.sourceType || "official_product_page")],
}));

export const COVERAGE_MODELS = [
  model({
    id: "rs-ez-17", manufacturer: "Rohde & Schwarz", model: "R&S EZ-17", equipmentType: "current_probe",
    subtype: "РЧ-токосъёмник", lifecycleStatus: "legacy", verificationStatus: "verified_official",
    frequencyRange: { minHz: 20, maxHz: 100_000_000 },
    specifications: { frequencyRange: "20 Гц–100 МГц", apertureMm: 17, maxCurrentA: "300 A", impedanceOhm: 50, connector: "N, female", transferImpedance: "см. индивидуальную калибровочную характеристику", dimensions: null },
    applications: ["conducted emissions", "измерение ВЧ-тока в проводнике"],
    searchTerms: ["EZ17", "R&S", "токосъёмник", "токосъемник", "current probe"],
    sources: [source("Rohde & Schwarz", "R&S EZ-17", "R&S EZ-17 current probe operating manual", "https://www.rohde-schwarz.com/manual/ez-17/", "official_manual")],
  }),
  ...official("Fischer Custom Communications", "https://www.fischercc.com/products/current-monitor-probes/", [
    ["F-14", "current_probe", "fcc-f-14"], ["F-33-2", "current_probe", "fcc-f-33-2"], ["F-40", "current_probe", "fcc-f-40"], ["F-61", "current_probe", "fcc-f-61"],
    ["F-35A", "bci_injection_probe", "fcc-f-35a"], ["F-130A", "bci_injection_probe", "fcc-f-130a"],
  ]),
  ...official("Solar Electronics", "https://www.solar-emc.com/current-probes.html", [
    ["9108-1N", "current_probe", "solar-9108-1n"], ["9144-1N", "current_probe", "solar-9144-1n"], ["9123-1N", "current_probe", "solar-9123-1n"],
  ]),
  ...official("Com-Power", "https://www.com-power.com/products/current-probes", [
    ["CP-30", "current_probe", "compower-cp-30"], ["CLCE-400", "current_probe", "compower-clce-400"], ["CLI-120", "bci_injection_probe", "compower-cli-120"],
  ]),
  ...official("ETS-Lindgren", "https://www.ets-lindgren.com/products/probes-monitors/current-probes", [
    ["91550-2", "current_probe", "ets-91550-2"], ["94111-1", "current_probe", "ets-94111-1", { lifecycleStatus: "legacy" }],
  ]),
  ...official("Tekbox", "https://www.tekbox.com/products/emc-probes/current-monitoring-probes/", [
    ["TBCP1-200", "current_probe", "tekbox-tbcp1-200"], ["TBCP2-500", "current_probe", "tekbox-tbcp2-500"], ["TBCP3-1000", "current_probe", "tekbox-tbcp3-1000"],
  ]),

  ...official("Lake Shore Cryotronics", "https://www.lakeshore.com/products/categories/overview/magnetic-products/gaussmeters", [
    ["F71", "magnetometer", "lakeshore-f71", { subtype: "Многокомпонентный teslameter", applications: ["AC/DC magnetic field measurement"] }],
    ["Model 425", "magnetometer", "lakeshore-425", { subtype: "Настольный gaussmeter", applications: ["DC magnetic field measurement"] }],
    ["Model 475 DSP", "magnetometer", "lakeshore-475", { subtype: "DSP gaussmeter", applications: ["AC/DC magnetic field measurement"] }],
  ]),
  ...official("Metrolab Technology", "https://www.metrolab.com/products/", [
    ["THM1176", "magnetometer", "metrolab-thm1176", { subtype: "Трёхосевой teslameter", applications: ["static and low-frequency magnetic field measurement"] }],
    ["THM1176-HF", "magnetometer", "metrolab-thm1176-hf", { subtype: "Трёхосевой teslameter", applications: ["AC/DC magnetic field measurement"] }],
  ]),
  ...official("Narda Safety Test Solutions", "https://www.narda-sts.com/en/servicesupport/product-literature/emf-selective-and-broadband/", [
    ["ELT-400", "magnetometer", "narda-elt-400", { subtype: "Измеритель низкочастотного магнитного поля", applications: ["environmental magnetic field measurement"] }],
  ]),

  ...official("Times Microwave Systems", "https://timesmicrowave.com/cables/", [
    ["LMR-195", "cable", "times-lmr-195", { subtype: "Тип коаксиального кабеля" }], ["LMR-240", "cable", "times-lmr-240", { subtype: "Тип коаксиального кабеля" }],
    ["LMR-400", "cable", "times-lmr-400", { subtype: "Тип коаксиального кабеля" }], ["LMR-600", "cable", "times-lmr-600", { subtype: "Тип коаксиального кабеля" }],
  ]),
  ...official("HUBER+SUHNER", "https://www.hubersuhner.com/en/products/radio-frequency/cables", [
    ["SUCOFLEX 104", "cable", "hubersuhner-sucoflex-104", { subtype: "Гибкая измерительная кабельная сборка" }],
    ["SUCOFLEX 106", "cable", "hubersuhner-sucoflex-106", { subtype: "Гибкая измерительная кабельная сборка" }],
    ["SUCOFLEX 126", "cable", "hubersuhner-sucoflex-126", { subtype: "Гибкая измерительная кабельная сборка" }],
  ]),
  ...official("Pasternack", "https://www.pasternack.com/rf-cable-assemblies-category.aspx", [["PE3C Series", "cable", "pasternack-pe3c", { subtype: "Семейство заводских RF-кабельных сборок" }]]),
  ...official("Mini-Circuits", "https://www.minicircuits.com/WebStore/RF-Cable-Assemblies.html", [["CBL Series", "cable", "minicircuits-cbl", { subtype: "Семейство заводских RF-кабельных сборок" }]]),

  ...official("Rohde & Schwarz", "https://www.rohde-schwarz.com/products/test-and-measurement/antennas-accessories_63493.html", [
    ["HFH2-Z2", "antenna", "rs-hfh2-z2", { subtype: "Активная рамочная антенна" }], ["HK116", "antenna", "rs-hk116", { subtype: "Biconical antenna" }],
    ["HL223", "antenna", "rs-hl223", { subtype: "Log-periodic antenna" }], ["HF907", "antenna", "rs-hf907", { subtype: "Double-ridged waveguide horn" }],
  ]),
  ...official("A.H. Systems", "https://www.ahsystems.com/catalog/index.php", [
    ["SAS-521-2", "antenna", "ahs-sas-521-2", { subtype: "Biconical antenna" }], ["SAS-510-2", "antenna", "ahs-sas-510-2", { subtype: "Log-periodic antenna" }],
    ["SAS-571", "antenna", "ahs-sas-571", { subtype: "Double-ridged guide horn" }], ["SAS-550-1B", "antenna", "ahs-sas-550-1b", { subtype: "Active monopole antenna" }],
  ]),
  ...official("Frankonia", "https://www.frankonia-solutions.com/products/antennas/", [
    ["BTA 4000", "antenna", "frankonia-bta-4000", { subtype: "BiLog antenna" }], ["HAX 18", "antenna", "frankonia-hax-18", { subtype: "Horn antenna" }],
  ]),

  // Supporting-path devices close dropdown gaps without inventing specifications.
  ...official("Mini-Circuits", "https://www.minicircuits.com/WebStore/dashboard.html", [
    ["ZHL-42W+", "rf_amplifier", "minicircuits-zhl-42w"], ["VAT-10+", "attenuator", "minicircuits-vat-10"],
    ["ZFDC-20-5+", "directional_coupler", "minicircuits-zfdc-20-5"], ["UNAT-10+", "adapter", "minicircuits-unat-10"],
    ["ZYSWA-2-50DR+", "rf_switch", "minicircuits-zyswa-2-50dr"], ["BW-S10W5+", "rf_load", "minicircuits-bw-s10w5"],
  ]),
  ...official("Keysight", "https://www.keysight.com/us/en/products.html", [
    ["8481D", "power_sensor", "keysight-8481d"], ["34138A", "test_fixture", "keysight-34138a"],
  ]),
  ...official("Tektronix", "https://www.tek.com/en/products", [["AFG1062", "impulse_generator", "tektronix-afg1062"]]),
  ...official("AMETEK CTS / Teseq", "https://www.ametek-cts.com/products", [
    ["NSG 1025", "impulse_generator", "teseq-nsg-1025"], ["CDN 117", "voltage_dip_generator", "teseq-cdn-117"], ["VAR 3005", "ac_power_source", "teseq-var-3005"],
  ]),
  ...official("RIGOL", "https://www.rigolna.com/products/", [["DL3021A", "load", "rigol-dl3021a"], ["DG1022Z", "impulse_generator", "rigol-dg1022z"]]),
  ...official("Fluke", "https://www.fluke.com/en-us/products/electrical-testing/digital-multimeters", [["8846A", "multimeter", "fluke-8846a"]]),
  ...official("Schwarzbeck", "https://www.schwarzbeck.de/en/products.html", [
    ["FMZB 1513", "magnetic_field_probe", "schwarzbeck-fmzb-1513"], ["FESP 5133", "preamplifier", "schwarzbeck-fesp-5133"],
  ]),
  ...official("Rohde & Schwarz", "https://www.rohde-schwarz.com/products/test-and-measurement/emi-test-receivers_63493.html", [["ESCI", "measurement_receiver", "rs-esci", { lifecycleStatus: "legacy" }]]),
  ...official("EM TEST", "https://www.emtest.com/products/", [
    ["UCS 500N7", "transient_generator", "emtest-ucs-500n7"], ["VDS 200N", "voltage_dip_generator", "emtest-vds-200n"],
    ["DPA 500N", "ac_power_source", "emtest-dpa-500n"], ["MFS 100", "magnetic_field_generator", "emtest-mfs-100"],
  ]),
  ...official("Montena Technology", "https://montena.com/products/", [["GTEM 500", "tem_cell", "montena-gtem-500"], ["EMP25K-2-23", "test_system", "montena-emp25k-2-23"]]),
  ...official("Haefely", "https://www.haefely.com/products/", [["PEFT 4010", "eft_generator", "haefely-peft-4010"], ["PSURGE 8000", "surge_generator", "haefely-psurge-8000"]]),
  ...official("Kikusui", "https://kikusuiamerica.com/products/", [["PCR-WE2", "ac_power_source", "kikusui-pcr-we2"]]),
  ...official("Bird", "https://birdrf.com/Products/Test%20and%20Measurement/RF-Power-Meters-Sensors.aspx", [["4421A", "power_meter", "bird-4421a"], ["8329-300", "rf_load", "bird-8329-300"]]),
  ...official("Maury Microwave", "https://www.maurymw.com/MW_RF/Calibration_Solutions.php", [["2650CK", "calibration_adapter", "maury-2650ck"]]),
  ...official("Pomona Electronics", "https://www.pomonaelectronics.com/products/accessories", [["3281", "adapter", "pomona-3281"]]),
  ...official("Chroma", "https://www.chromaate.com/en/product/electronic_load", [["63200A Series", "load", "chroma-63200a"]]),
  ...official("ETS-Lindgren", "https://www.ets-lindgren.com/products/cells", [["5407", "tem_cell", "ets-5407"]]),
];
