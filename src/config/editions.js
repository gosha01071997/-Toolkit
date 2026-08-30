export const EDITIONS = Object.freeze({
  COMMUNITY: "community",
  PERSONAL: "personal",
  PRO: "pro",
  LAB: "lab",
});

export const COMMUNITY_FEATURES = Object.freeze({
  calculators: true,
  converters: true,
  knowledgeBase: true,
  fullKnowledgeBase: true,
  checklists: true,
  favorites: false,
  notes: false,
  localStorage: false,
  equipment: true,
  calibration: true,
  tests: true,
  spectrumAnalyzer: true,
  advancedJournal: false,
  protocols: false,
  ai: false,
  importExport: false,
  advancedStorage: false,
  corporate: false,
});

const PERSONAL_FEATURES = {
  ...COMMUNITY_FEATURES,
  fullKnowledgeBase: true,
  favorites: true,
  notes: true,
  localStorage: true,
};

export const PRO_ONLY_FEATURES = Object.freeze({
  protocols: true,
  ai: true,
  advancedJournal: true,
  importExport: true,
  advancedStorage: true,
});

// Pro is a strict superset of Community. Personal preferences are retained for
// compatibility with already issued licenses, while access to engineering tools
// always comes from the Community feature set.
export const PRO_FEATURES = Object.freeze({
  ...COMMUNITY_FEATURES,
  ...PERSONAL_FEATURES,
  ...PRO_ONLY_FEATURES,
});

export const EDITION_CONFIG = Object.freeze({
  [EDITIONS.COMMUNITY]: { label: "EMC Toolkit Community", features: COMMUNITY_FEATURES },
  [EDITIONS.PERSONAL]: { label: "EMC Toolkit Personal", features: Object.freeze(PERSONAL_FEATURES) },
  [EDITIONS.PRO]: { label: "EMC Toolkit Pro", features: PRO_FEATURES },
  // Lab is not a separate application: it uses Pro as its technical foundation.
  [EDITIONS.LAB]: { label: "EMC Toolkit Lab", features: Object.freeze({ ...PRO_FEATURES, corporate: true }) },
});

// Build scripts remain compatible, but commercial editions are unlocked only by
// setActiveEdition after cryptographic license verification. A Community build can
// never be elevated by a key intended for another distributable.
const requestedEdition = String(import.meta.env.VITE_APP_EDITION || "all").toLowerCase();
// Development/test-only feature-gating bypass. It does not change the active
// edition and never creates or persists a license.
export const isLicenseGatingDisabled = String(import.meta.env.VITE_DISABLE_LICENSE_GATING || "").toLowerCase() === "true";
export const maximumEdition = requestedEdition === EDITIONS.COMMUNITY ? EDITIONS.COMMUNITY : "all";
export let currentEdition = EDITIONS.COMMUNITY;
export let editionConfig = EDITION_CONFIG[currentEdition];
export const setActiveEdition = (edition) => {
  const allowed = EDITION_CONFIG[edition] && (maximumEdition === "all" || edition === EDITIONS.COMMUNITY);
  currentEdition = allowed ? edition : EDITIONS.COMMUNITY;
  editionConfig = EDITION_CONFIG[currentEdition];
  return currentEdition;
};
export const hasFeature = (feature) => isLicenseGatingDisabled || editionConfig.features[feature] === true;

export const UPGRADE_MESSAGE = "Эта функция доступна в полной версии EMC Toolkit для Windows.";
