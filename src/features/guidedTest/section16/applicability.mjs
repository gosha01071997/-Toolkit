import { SECTION_16_PROCEDURES } from "./procedures.mjs";

export function applicableSection16Procedures(configuration, profile) {
  if (!configuration?.powerType) return [];
  return profile.applicabilityRules
    .filter(rule => rule.powerTypes.includes(configuration.powerType)
      && (!rule.categories || rule.categories.includes(configuration.category)))
    .map(rule => SECTION_16_PROCEDURES[rule.procedureId]).filter(Boolean);
}
