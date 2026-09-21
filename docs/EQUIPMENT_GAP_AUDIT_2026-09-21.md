# Equipment Database GAP audit — 2026-09-21

## Method and quality gate

The audit enumerated every value in `EQUIPMENT_TYPE_OPTIONS`, rather than treating a populated UI category as complete. The baseline was captured before the third-pass records were added. Candidate names were selected from manufacturer product/archive pages and the already catalogued Russian system suppliers (including ГЦМО ЭМС system composition); technical fields were retained only where an official source supports the exact model. An absent value remains `null` or omitted. Product photographs, logos, PDFs, plots and third-party database content are not distributed.

Laboratory-instance data and model data are deliberately separate. Cable records represent a reusable cable type or a named factory assembly family. The local asset stores its actual length, two connectors and serial number. Its measured `calibrationCharacteristic` is never populated from a generic web value.

## Headline result

| Metric | Before | After |
|---|---:|---:|
| Total models | 154 | 230 |
| Manufacturers | 21 | 39 |
| Empty categories | 10 | 1 (`other`, intentionally not a product category) |
| Poor categories (1–3 models) | 24 | 22 |

“Poor” is a mechanical count flag, not a claim that three carefully chosen models are inadequate. Narrow accessory categories remain flagged for future evidence-led work. No unverified filler was added merely to increase a count.

## Complete dropdown coverage

Status: **GOOD** ≥10 models, **PARTIAL** 4–9, **POOR** 1–3, **EMPTY** 0.

| Category | Before | After | Manufacturers after | Status |
|---|---:|---:|---:|---|
| measurement_receiver | 3 | 4 | 1 | PARTIAL (single maker; legacy present) |
| spectrum_analyzer | 16 | 16 | 7 | GOOD |
| signal_generator | 17 | 17 | 6 | GOOD |
| function_generator | 9 | 9 | 5 | PARTIAL |
| dc_power_supply | 11 | 11 | 4 | GOOD |
| ac_power_source | 1 | 4 | 4 | PARTIAL |
| power_amplifier | 12 | 12 | 3 | GOOD |
| rf_amplifier | 0 | 1 | 1 | POOR |
| preamplifier | 2 | 3 | 3 | POOR |
| current_probe | 5 | 20 | 7 | GOOD |
| bci_injection_probe | 1 | 4 | 2 | PARTIAL |
| lisn | 6 | 6 | 4 | PARTIAL |
| cdn | 3 | 3 | 3 | POOR |
| antenna | 12 | 22 | 8 | GOOD |
| power_meter | 5 | 6 | 4 | PARTIAL |
| power_sensor | 1 | 2 | 1 | POOR |
| attenuator | 0 | 1 | 1 | POOR |
| directional_coupler | 0 | 1 | 1 | POOR |
| calibration_fixture | 5 | 5 | 4 | PARTIAL |
| calibration_adapter | 1 | 2 | 2 | POOR |
| cable | 0 | 9 | 4 | PARTIAL |
| adapter | 0 | 2 | 2 | POOR |
| field_probe | 3 | 3 | 2 | POOR |
| magnetic_field_probe | 1 | 2 | 2 | POOR |
| oscilloscope | 11 | 11 | 7 | GOOD |
| multimeter | 6 | 7 | 3 | PARTIAL |
| magnetometer | 0 | 6 | 3 | PARTIAL |
| impulse_generator | 0 | 3 | 3 | POOR |
| eft_generator | 1 | 2 | 2 | POOR |
| surge_generator | 1 | 2 | 2 | POOR |
| esd_generator | 2 | 2 | 2 | POOR |
| voltage_dip_generator | 1 | 3 | 3 | POOR |
| transient_generator | 2 | 3 | 3 | POOR |
| transformer | 1 | 1 | 1 | POOR |
| load | 0 | 2 | 2 | POOR |
| rf_switch | 1 | 2 | 2 | POOR |
| rf_load | 0 | 2 | 2 | POOR |
| frequency_counter | 3 | 3 | 1 | POOR |
| electronic_load | 4 | 4 | 1 | PARTIAL |
| tem_cell | 2 | 4 | 3 | PARTIAL |
| magnetic_field_generator | 1 | 2 | 2 | POOR |
| test_fixture | 1 | 2 | 2 | POOR |
| test_system | 3 | 4 | 3 | PARTIAL |
| other | 0 | 0 | 0 | EMPTY — intentional free-form type; no defensible model set |

All populated broad instrument categories include foreign equipment. Russian models are concentrated in generators, analyzers, oscilloscopes, power supplies, loads, counters, antennas, amplifiers, TEM cells, fixtures and magnetic-field generation. Confirmed legacy records include R&S ESS, ESRP, ESCI and EZ-17 and ETS-Lindgren 94111-1.

## Priority findings and actions

| Area | Baseline manufacturers / important gaps | Result |
|---|---|---|
| Current probes | Tekbox, Langer, ETS-Lindgren, Fischer; missing EZ-17 and broader families | Added official-source R&S EZ-17 plus Fischer, Solar, Com-Power, ETS and Tekbox families; 20 models / 7 makers |
| Magnetometers | Empty; Lake Shore, Metrolab and Narda absent | Added six finished laboratory instruments; kept separate from magnetic probes, loop antennas and generators |
| Cables | Empty; no type-vs-assembly architecture | Added LMR types, SUCOFLEX assemblies and bounded Mini-Circuits/Pasternack families; instance fields capture length/connectors |
| Antennas | Five makers; missing R&S, A.H. Systems and Frankonia | Added loop, biconical, log-periodic, horn, BiLog and monopole examples; 22 models / 8 makers |
| Supporting RF path | attenuator/coupler/adapter/RF load/RF amplifier empty | Added identifiable official products without inferred specifications |
| Transient/immunity | several one-model categories | Added EM TEST, Haefely, Teseq and Kikusui coverage; still flagged where narrow |

## Manufacturer review

* **Rohde & Schwarz:** 14 records after the pass; EZ-17 is a legacy current probe with normalized `EZ17`, `R&S`, Russian and English search terms. Antenna subtypes and legacy ESCI were added.
* **АКИП:** 48 applicable instruments remain available at runtime across signal/function generation, spectrum analysis, scopes, DC supplies, electronic loads, counters and multimeters.
* **ГЦМО ЭМС:** 15 records cover the РА/WA amplifier families, switching and power measurement, TEM/stripline equipment, fixtures, antennas and magnetic/low-frequency generation. Exact named variants should replace family records only when an exact official page is available.
* **СКАРД:** five antennas are present.
* **LUMILOOP:** seven runtime records: LSProbe 1.2, LSProbe 2.0, CI-250, CI-250 Plus, and LSPM 1.0/1.1/2.0.
* **Fischer Custom Communications:** ten records, including five current-monitor/BCI probes plus fixture and CDN coverage.
* **ETS-Lindgren / EMCO:** eight records spanning antennas, field/current probes and TEM cell; legacy 94111-1 is retained.
* **Schwarzbeck:** six records spanning antennas, LISN, calibration fixture, magnetic probe and preamplifier.
* **Others added in this pass:** Solar Electronics, Com-Power, Tekbox, Lake Shore, Metrolab, Narda, Times Microwave, HUBER+SUHNER, Pasternack, Mini-Circuits, A.H. Systems, Frankonia, EM TEST, Haefely, Montena, Kikusui, Bird, Maury, Pomona, Chroma and Fluke.

## Remaining evidence-led gaps

The count audit still marks many specialist accessory categories as poor. This is explicit rather than hidden: transformer, directional coupler, attenuator and dedicated calibration categories need more exact-model official evidence. `other` remains empty by design because it is the manual catch-all. Family-level ГЦМО and АКИП entries should not receive sibling specifications without exact-model documentation. The audit therefore improves real-lab findability without pretending that count alone means completeness.
