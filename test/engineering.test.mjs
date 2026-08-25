import test from "node:test";
import assert from "node:assert/strict";
import {
  antennaFactorReceive, antennaFactorTransmit, antennaPositionStep, chamberBeatFrequencyMHz,
  chamberKField, chamberKPower, chamberModesEquivalent, chamberModesRectangular, shieldingEffectiveness,
} from "../src/calculations/engineering.mjs";
import { EMC_LIMITS, evaluateLimit } from "../src/data/limits/emcLimits.mjs";

const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≉ ${expected}`);

test("число типов волн прямоугольной камеры", () => close(chamberModesRectangular(3, 4, 5, 100e6), (8*Math.PI/3)*3*4*5*100e6**3/3e8**3));
test("число типов волн по эквивалентному объёму", () => close(chamberModesEquivalent(60, 100e6), (8*Math.PI/3)*60*100e6**3/3e8**3));
test("fbeat сохраняет коэффициент 150", () => close(chamberBeatFrequencyMHz(3, 4), 62.5));
test("K камеры по мощности", () => { const r=chamberKPower({frequencyHz:100e6,receivedMax:2,incident:10});close(r.wavelength,3);close(r.k,(8*Math.PI/3)*Math.sqrt(1)); });
test("K камеры по трём составляющим поля", () => { const r=chamberKField(3,4,0,2);close(r.rmsComponent,Math.sqrt(25/3));close(r.k,Math.sqrt(25/6)); });
test("шаг позиций антенн B=A/N и защита N", () => { assert.equal(antennaPositionStep(10,5),2);assert.throws(()=>antennaPositionStep(10,0)); });
test("приёмный AF в линейных единицах", () => { const r=antennaFactorReceive({frequencyHz:100e6,u1:2,u2:1,distance:3});close(r.deltaU,1);close(r.k1,2);close(r.gain,2*Math.PI);close(r.af,20*Math.log10(9.76/(3*Math.sqrt(2*Math.PI)))); });
test("приёмный AF не смешивает dB и линейное отношение", () => close(antennaFactorReceive({frequencyHz:100e6,u1:26.020599913,u2:20,distance:3,unit:"db"}).k1,2,1e-9));
test("передающий AFT", () => close(antennaFactorTransmit({af:10,distance:3,wavelength:2}),20*Math.log10(3)-10-32-20*Math.log10(2)));
test("эффективность экранирования", () => assert.equal(shieldingEffectiveness(80,25),55));

const cases = [
  ["voltage",0.01,94,100,48], ["current",0.15,73,30,40],
  ["field1",10,34,18000,20*Math.log10(18000)-6],
  ["field2",0.01,30-15.65*Math.log10(.01),18000,20*Math.log10(18000)-16],
];
for (const [id,start,startValue,end,endValue] of cases) test(`${id}: начало, конец и вне общего диапазона`,()=>{const c=EMC_LIMITS[id];close(evaluateLimit(c,start),startValue);close(evaluateLimit(c,end),endValue);assert.equal(evaluateLimit(c,start*(1-1e-8)),null);assert.equal(evaluateLimit(c,end*(1+1e-8)),null);});

test("границы всех piecewise-сегментов принадлежат следующему диапазону",()=>{
  assert.equal(evaluateLimit(EMC_LIMITS.voltage,2),48);
  assert.equal(evaluateLimit(EMC_LIMITS.current,2),40);
  assert.equal(evaluateLimit(EMC_LIMITS.field1,100),20*Math.log10(100)-6);
  assert.equal(evaluateLimit(EMC_LIMITS.field2,2),24);
  assert.equal(evaluateLimit(EMC_LIMITS.field2,100),20*Math.log10(100)-16);
});
