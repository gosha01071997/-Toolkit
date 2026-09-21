/**
 * Methods only describe physical effects and engineer actions. Exact levels and
 * durations intentionally remain in a normative profile, never in React code.
 */
export const SECTION_16_PROCEDURES = Object.freeze({
  steadyVoltage: {
    id: "steadyVoltage", type: "steady-voltage", title: "Установившееся напряжение",
    requiredEquipment: ["programmable-power-source", "voltage-monitor"],
    setup: ["Подключите изделие к источнику через измерительный тракт.", "Подготовьте контроль работоспособности изделия."],
    parameters: ["voltageSequence"],
    actions: ["Установите указанное профилем напряжение.", "Выдержите воздействие указанное профилем время.", "Перейдите к следующему уровню последовательности."],
    monitoring: ["Контролируйте фактическое напряжение и работу изделия."],
    result: ["Зафиксируйте наблюдения и результат для каждого уровня."], executionModes: ["manual", "automated"],
  },
  ripple: {
    id: "ripple", type: "ripple", title: "Пульсации напряжения",
    requiredEquipment: ["power-source", "ripple-generator", "voltage-monitor"],
    setup: ["Соберите тракт питания и контроля пульсаций.", "Включите контроль работоспособности изделия."],
    parameters: ["rippleProfile"], actions: ["Создайте воздействие по последовательности нормативного профиля."],
    monitoring: ["Контролируйте форму воздействия и работу изделия."], result: ["Сохраните измерения и наблюдения."], executionModes: ["manual", "automated"],
  },
  interruption: {
    id: "interruption", type: "short-interruption", title: "Кратковременные прерывания",
    requiredEquipment: ["programmable-power-source", "voltage-monitor"],
    setup: ["Подготовьте управляемое прерывание питания и контроль изделия."], parameters: ["interruptionSequence"],
    actions: ["Выполните последовательность прерываний из нормативного профиля."], monitoring: ["Контролируйте питание и состояние изделия."],
    result: ["Зафиксируйте реакцию и восстановление изделия."], executionModes: ["manual", "automated"],
  },
  transient: {
    id: "transient", type: "normal-transient", title: "Нормальные переходные процессы",
    requiredEquipment: ["transient-generator", "voltage-monitor"], setup: ["Подготовьте источник переходного процесса и измерительный тракт."],
    parameters: ["transientProfile"], actions: ["Создайте воздействия в последовательности нормативного профиля."],
    monitoring: ["Контролируйте форму воздействия и работу изделия."], result: ["Сохраните осциллограммы и наблюдения."], executionModes: ["manual", "automated"],
  },
  starting: {
    id: "starting", type: "starting", title: "Режим запуска",
    requiredEquipment: ["programmable-power-source", "voltage-monitor"], setup: ["Подготовьте изделие к запуску и включите запись питания."],
    parameters: ["startingProfile"], actions: ["Запустите изделие при условиях из нормативного профиля."],
    monitoring: ["Контролируйте питание и завершение запуска."], result: ["Зафиксируйте результат запуска."], executionModes: ["manual", "automated"],
  },
  abnormal: {
    id: "abnormal", type: "abnormal", title: "Ненормальные режимы питания",
    requiredEquipment: ["protected-power-source", "voltage-monitor"], setup: ["Настройте защиты стенда и безопасное отключение изделия."],
    parameters: ["abnormalProfile"], actions: ["Выполните только подтверждённую профилем последовательность ненормальных режимов."],
    monitoring: ["Контролируйте безопасность, питание и состояние изделия."], result: ["Зафиксируйте реакцию изделия и состояние после воздействия."], executionModes: ["manual", "automated"],
  },
});
