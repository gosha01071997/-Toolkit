import React, { useState } from "react";
import GuidedTestRunner from "./GuidedTestRunner";
import { demoScenario } from "./demoScenario.mjs";
import { section15MagneticEffect } from "./scenarios/section15MagneticEffect.mjs";
import Section16GuidedTest from "./Section16GuidedTest";

const section16 = { id: "section16", title: "16 — Восприимчивость по входу электропитания", description: "Маршрут испытаний по конфигурации питания с ручным и автоматизированным выполнением." };
const scenarios = [section15MagneticEffect, section16, demoScenario];
export default function GuidedTestHub({ onOpenEquipment }) {
  const [selected, setSelected] = useState(null);
  if (selected === section16) return <Section16GuidedTest onOpenEquipment={onOpenEquipment} onBackToSelection={() => setSelected(null)}/>;
  if (selected) return <GuidedTestRunner scenario={selected} onOpenEquipment={onOpenEquipment} onBackToSelection={() => setSelected(null)}/>;
  return <main className="guided-picker"><span className="guided-kicker">Guided Test Engine</span><h1>Выберите испытание</h1><p>Запустите пошаговый мастер и продолжите с сохранённого этапа.</p><div className="scenario-grid">{scenarios.map(scenario => <button key={scenario.id} onClick={() => setSelected(scenario)}><strong>{scenario.title}</strong><span>{scenario.description}</span>{scenario === demoScenario && <small>Технический ненормативный сценарий</small>}</button>)}</div></main>;
}
