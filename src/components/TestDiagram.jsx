import React from "react";
import { diagramFor } from "../data/testDiagrams";
import { equipmentForDiagram } from "../data/testEquipment";
import "./TestDiagram.css";

const COLORS = { stimulus:"#e85d3f", field:"#9b5de5", measure:"#168aad", cable:"#475569", power:"#d97706", emission:"#c026d3" };

const center = (item) => ({ x:item.x + (item.w || 140) / 2, y:item.y + (item.h || 64) / 2 });

function EquipmentNode({ item, index }) {
  const w = item.w || 140;
  const h = item.h || 64;
  const lines = item.label.split("\n");
  return <g className={`test-diagram__node ${item.type === "eut" ? "is-eut" : ""}`}>
    <rect x={item.x} y={item.y} width={w} height={h} rx="12" />
    <circle cx={item.x + 17} cy={item.y + 17} r="10" />
    <text className="test-diagram__number" x={item.x + 17} y={item.y + 21} textAnchor="middle">{index + 1}</text>
    <text className="test-diagram__label" x={item.x + w / 2} y={item.y + h / 2 - (lines.length - 1) * 8} textAnchor="middle">
      {lines.map((line, lineIndex) => <tspan key={line} x={item.x + w / 2} dy={lineIndex ? 17 : 0}>{line}</tspan>)}
    </text>
    <text className="test-diagram__type" x={item.x + w / 2} y={item.y + h - 8} textAnchor="middle">{item.type}</text>
  </g>;
}

function Connection({ value, nodes, markerId }) {
  const from = nodes.find(item => item.id === value.from);
  const to = nodes.find(item => item.id === value.to);
  if (!from || !to) return null;
  const a = center(from), b = center(to);
  const dx = b.x - a.x, dy = b.y - a.y;
  const concentric = dx === 0 && dy === 0;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const start = concentric ? { x:from.x + (from.w || 140), y:a.y } : { x:a.x + (horizontal ? Math.sign(dx) * (from.w || 140) / 2 : 0), y:a.y + (!horizontal ? Math.sign(dy) * (from.h || 64) / 2 : 0) };
  const end = concentric ? { x:to.x + (to.w || 140), y:to.y } : { x:b.x - (horizontal ? Math.sign(dx) * (to.w || 140) / 2 : 0), y:b.y - (!horizontal ? Math.sign(dy) * (to.h || 64) / 2 : 0) };
  const path = concentric ? `M${start.x} ${start.y} C${start.x + 52} ${start.y}, ${start.x + 52} ${end.y - 38}, ${end.x} ${end.y}` : `M${start.x} ${start.y} L${end.x} ${end.y}`;
  const labelPosition = concentric ? { x:start.x + 50, y:end.y - 28 } : { x:(start.x + end.x) / 2, y:(start.y + end.y) / 2 - 8 };
  const color = COLORS[value.kind] || COLORS.cable;
  return <g>
    <path className={`test-diagram__connection is-${value.kind}`} d={path} stroke={color} markerEnd={`url(#${markerId}-${value.kind})`} />
    {value.label && <text className="test-diagram__connection-label" x={labelPosition.x} y={labelPosition.y} textAnchor="middle" fill={color}>{value.label}</text>}
  </g>;
}

export default function TestDiagram({ type }) {
  const diagram = diagramFor(type);
  const equipment = equipmentForDiagram(type);
  if (!diagram) return null;
  const nodeOrder = new Map(equipment.map(([equipmentType], index) => [equipmentType, index]));
  const orderedNodes = diagram.nodes.map((item, index) => ({ ...item, equipmentIndex:nodeOrder.has(item.type) ? nodeOrder.get(item.type) : index }));
  const markerId = `diagram-arrow-${type}`;
  return <section className="test-diagram" aria-label={diagram.title}>
    <div className="test-diagram__canvas">
      <svg viewBox="0 0 960 310" role="img" aria-labelledby={`${type}-title ${type}-desc`}>
        <title id={`${type}-title`}>{diagram.title}</title>
        <desc id={`${type}-desc`}>Авторская инженерная схема состава, соединений, направления воздействия и измерительного тракта.</desc>
        <defs>{Object.entries(COLORS).map(([kind,color]) => <marker key={kind} id={`${markerId}-${kind}`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill={color}/></marker>)}</defs>
        <rect className="test-diagram__sheet" x="1" y="1" width="958" height="308" rx="16" />
        <text className="test-diagram__title" x="28" y="32">{diagram.title}</text>
        {diagram.plane && <g><rect className="test-diagram__zone" x="25" y="42" width="910" height="225" rx="14"/><text className="test-diagram__plane-label" x="480" y="288" textAnchor="middle">{diagram.plane}</text></g>}
        {diagram.horizontalPlane && <g><rect className="test-diagram__horizontal-plane" x="350" y="205" width="330" height="16" rx="3"/><text className="test-diagram__plane-label" x="515" y="241" textAnchor="middle">Горизонтальная пластина связи · изолирующая подставка</text></g>}
        {diagram.ground && <g><rect className="test-diagram__ground" x="25" y="270" width="910" height="12" rx="2"/><text className="test-diagram__plane-label" x="480" y="299" textAnchor="middle">Опорная плоскость заземления</text></g>}
        {diagram.links.map((value,index) => <Connection key={`${value.from}-${value.to}-${index}`} value={value} nodes={orderedNodes} markerId={markerId}/>)}
        {orderedNodes.map(item => <EquipmentNode key={item.id} item={item} index={item.equipmentIndex}/>) }
        {diagram.note && <text className="test-diagram__note" x="28" y="258">{diagram.note}</text>}
      </svg>
    </div>
    {diagram.inset && <div className="test-diagram__inset">{diagram.inset}</div>}
    <div className="test-diagram__legend" aria-label="Условные обозначения">
      <span><i className="is-stimulus"/>Воздействие</span><span><i className="is-field"/>Поле / бесконтактная связь</span><span><i className="is-measure"/>Измерительный тракт</span><span><i className="is-cable"/>Кабель / соединение</span><span><b/>Испытуемое изделие</span>
    </div>
    <div className="test-diagram__equipment">
      <h3>Состав испытательного оборудования</h3>
      <ol>{equipment.map(([equipmentType,label]) => <li key={`${equipmentType}-${label}`} data-equipment-type={equipmentType}><span>{label}</span><code>{equipmentType}</code></li>)}</ol>
    </div>
  </section>;
}
