import React, { useState } from "react";
import GuidedTestRunner from "./GuidedTestRunner";
import { demoScenario } from "./demoScenario.mjs";
import { section15MagneticEffect } from "./scenarios/section15MagneticEffect.mjs";

const scenarios = [section15MagneticEffect, demoScenario];
export default function GuidedTestHub({ onOpenEquipment }) {
  const [selected, setSelected] = useState(null);
  if (selected) return <GuidedTestRunner scenario={selected} onOpenEquipment={onOpenEquipment} onBackToSelection={() => setSelected(null)}/>;
  return <main className="guided-picker"><span className="guided-kicker">Guided Test Engine</span><h1>Выберите испытание</h1><p>Запустите пошаговый мастер и продолжите с сохранённого этапа.</p><div className="scenario-grid">{scenarios.map(scenario => <button key={scenario.id} onClick={() => setSelected(scenario)}><strong>{scenario.title}</strong><span>{scenario.description}</span>{scenario === demoScenario && <small>Технический ненормативный сценарий</small>}</button>)}</div></main>;
}
