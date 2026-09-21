export const EQUIPMENT_TYPE_OPTIONS = [
  ["measurement_receiver", "Измерительный приёмник"], ["spectrum_analyzer", "Анализатор спектра"],
  ["signal_generator", "ВЧ-генератор"], ["function_generator", "Функциональный генератор"],
  ["dc_power_supply", "Источник питания DC"], ["ac_power_source", "Источник питания AC"],
  ["power_amplifier", "Усилитель мощности"], ["rf_amplifier", "ВЧ-усилитель"],
  ["preamplifier", "Предусилитель"], ["current_probe", "Токосъёмник / Current probe"],
  ["bci_injection_probe", "BCI-инжектор / Injection probe"], ["lisn", "LISN / ЛИСН"], ["cdn", "CDN"],
  ["antenna", "Антенна"], ["power_meter", "Измеритель мощности"], ["power_sensor", "Датчик мощности"],
  ["attenuator", "Аттенюатор"], ["directional_coupler", "Направленный ответвитель"],
  ["calibration_fixture", "Калибровочная оснастка"], ["calibration_adapter", "Калибровочный адаптер"],
  ["cable", "Кабель"], ["adapter", "Переходник / адаптер"], ["field_probe", "Пробник электрического поля"],
  ["magnetic_field_probe", "Пробник магнитного поля"], ["oscilloscope", "Осциллограф"],
  ["multimeter", "Мультиметр"], ["magnetometer", "Магнитометр"], ["impulse_generator", "Импульсный генератор"],
  ["eft_generator", "EFT-генератор"], ["surge_generator", "Surge-генератор"], ["esd_generator", "ESD-генератор"],
  ["voltage_dip_generator", "Генератор провалов и прерываний"], ["transient_generator", "Генератор переходных процессов"],
  ["transformer", "Трансформатор"], ["load", "Эквивалент нагрузки"], ["rf_switch", "RF-коммутатор"],
  ["test_system", "Испытательная система / стенд"], ["other", "Другое"],
];

export const EQUIPMENT_TYPE_IDS = new Set(EQUIPMENT_TYPE_OPTIONS.map(([id]) => id));
export const typeLabel = id => EQUIPMENT_TYPE_OPTIONS.find(([value]) => value === id)?.[1] || id;

export const SPECIFICATION_LABELS = {
  frequencyRange: "Диапазон частот", outputLevelRange: "Диапазон выходного уровня", impedanceOhm: "Импеданс",
  apertureMm: "Диаметр окна", transferImpedance: "Передаточный импеданс", maxPowerW: "Максимальная мощность",
  ratedOutputPowerW: "Номинальная выходная мощность", gainDb: "Коэффициент усиления", attenuationDb: "Ослабление",
  conductorConfiguration: "Конфигурация проводников", antennaType: "Тип антенны", voltageRange: "Диапазон напряжения",
  currentRange: "Диапазон тока", maxVoltageV: "Максимальное напряжение", maxCurrentA: "Максимальный ток",
  maxPowerVa: "Максимальная мощность", connector: "Разъём", detectors: "Детекторы", rbw: "Полоса разрешения",
  phenomenon: "Испытательное воздействие", bandwidths: "Полосы пропускания", riseTime: "Время нарастания",
  compatibleModels: "Совместимые модели", channels: "Число каналов", displaySpecification: "Документированная характеристика",
};
export const specificationLabel = key => SPECIFICATION_LABELS[key] || key;

export const source = (manufacturer, model, title, url, type = "official_product_page") => ({
  manufacturer, model, title, url, type, dateChecked: "2026-09-21",
});

export const model = value => ({
  lifecycleStatus: "current", verificationStatus: "partially_verified", imageAsset: null,
  frequencyRange: null, specifications: {}, applications: [], compatibleAccessories: [], relatedModels: [], ...value,
});
