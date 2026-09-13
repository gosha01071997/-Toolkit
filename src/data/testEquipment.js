export const TEST_EQUIPMENT = {
  magnetic: [
    ["signal_generator", "Источник испытательного сигнала"], ["amplifier", "Усилитель"],
    ["coil", "Испытательная катушка"], ["field_probe", "Измеритель магнитного поля"], ["eut", "Испытуемое изделие"],
  ],
  power: [
    ["power_source", "Программируемый источник питания"], ["power_analyzer", "Анализатор параметров питания"],
    ["oscilloscope", "Осциллограф"], ["eut", "Испытуемое изделие"],
  ],
  voltageSpike: [
    ["power_source", "Источник питания"], ["pulse_generator", "Генератор импульса"],
    ["coupling_network", "Устройство ввода импульса"], ["oscilloscope", "Измерительная цепь"], ["eut", "Испытуемое изделие"],
  ],
  audioPower: [
    ["power_source", "Источник штатного питания"], ["signal_generator", "Генератор сигнала"],
    ["amplifier", "Усилитель / устройство ввода"], ["coupling_network", "Цепь связи и развязки"],
    ["oscilloscope", "Измерительные средства"], ["eut", "Испытуемое изделие"],
  ],
  induced: [
    ["signal_generator", "Генератор сигнала"], ["amplifier", "Усилитель"],
    ["coupling_device", "Устройство связи / индукции"], ["cable", "Испытательный кабельный жгут"],
    ["oscilloscope", "Измеритель / осциллограф"], ["eut", "Испытуемое изделие"],
  ],
  rfParent: [
    ["generator", "Генератор РЧ-сигнала"], ["amplifier", "Усилитель мощности"],
    ["bci_injector", "BCI-инжектор"], ["antenna", "Передающая антенна"],
    ["current_probe", "Токовый монитор"], ["field_probe", "Датчик поля"], ["eut", "Испытуемое изделие"],
  ],
  bci: [
    ["generator", "Генератор РЧ-сигнала"], ["amplifier", "Усилитель мощности"],
    ["bci_injector", "BCI-инжектор"], ["current_probe", "Контрольный токовый пробник"],
    ["receiver", "Измерительный приёмник"], ["cable", "Кабельный жгут"], ["eut", "Испытуемое изделие"],
  ],
  radiatedImmunity: [
    ["generator", "Генератор РЧ-сигнала"], ["amplifier", "Усилитель мощности"],
    ["antenna", "Передающая антенна"], ["field_probe", "Датчик поля"], ["eut", "Испытуемое изделие"],
  ],
  emissionParent: [
    ["eut", "Испытуемое изделие"], ["lisn", "LISN / измерительная сеть"],
    ["antenna", "Приёмная антенна"], ["receiver", "Измерительный приёмник"], ["cable", "Измерительный кабельный тракт"],
  ],
  conductedEmission: [
    ["eut", "Испытуемое изделие"], ["cable", "Кабельный жгут"],
    ["lisn", "LISN / измерительная сеть"], ["receiver", "Измерительный приёмник"], ["power_source", "Источник питания"],
  ],
  radiatedEmission: [
    ["eut", "Испытуемое изделие"], ["antenna", "Приёмная антенна"],
    ["receiver", "Измерительный приёмник"], ["cable", "Измерительный кабельный тракт"], ["test_site", "Испытательная площадка / камера"],
  ],
  esd: [
    ["esd_generator", "Генератор ЭСР"], ["eut", "Испытуемое изделие"],
    ["horizontal_coupling_plane", "Горизонтальная пластина связи"], ["vertical_coupling_plane", "Вертикальная пластина связи"],
    ["ground_plane", "Опорная плоскость заземления"],
  ],
};

export const equipmentForDiagram = (type) => TEST_EQUIPMENT[type] || [];
