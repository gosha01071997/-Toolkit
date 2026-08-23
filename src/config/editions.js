export const EDITIONS = Object.freeze({
  COMMUNITY: "community",
  PERSONAL: "personal",
  PRO: "pro",
  LAB: "lab",
});

const COMMUNITY_FEATURES = {
  calculators: true,
  converters: true,
  knowledgeBase: true,
  fullKnowledgeBase: false,
  checklists: true,
  favorites: false,
  notes: false,
  localStorage: false,
  equipment: false,
  calibration: false,
  tests: false,
  protocols: false,
  ai: false,
  importExport: false,
  advancedStorage: false,
  corporate: false,
};

const PERSONAL_FEATURES = {
  ...COMMUNITY_FEATURES,
  fullKnowledgeBase: true,
  favorites: true,
  notes: true,
  localStorage: true,
};

const PRO_FEATURES = {
  ...PERSONAL_FEATURES,
  equipment: true,
  calibration: true,
  tests: true,
  protocols: true,
  ai: true,
  importExport: true,
  advancedStorage: true,
};

export const EDITION_CONFIG = Object.freeze({
  [EDITIONS.COMMUNITY]: { label: "EMC Toolkit Community", features: Object.freeze(COMMUNITY_FEATURES) },
  [EDITIONS.PERSONAL]: { label: "EMC Toolkit Personal", features: Object.freeze(PERSONAL_FEATURES) },
  [EDITIONS.PRO]: { label: "EMC Toolkit Pro", features: Object.freeze(PRO_FEATURES) },
  // Lab is not a separate application: it uses Pro as its technical foundation.
  [EDITIONS.LAB]: { label: "EMC Toolkit Lab", features: Object.freeze({ ...PRO_FEATURES, corporate: true }) },
});

const requestedEdition = String(import.meta.env.VITE_APP_EDITION || EDITIONS.PRO).toLowerCase();

// The edition is compiled into the bundle. URL parameters and localStorage are
// deliberately ignored; a future license provider can replace this resolver.
export const currentEdition = EDITION_CONFIG[requestedEdition] ? requestedEdition : EDITIONS.PRO;
export const editionConfig = EDITION_CONFIG[currentEdition];
export const hasFeature = (feature) => editionConfig.features[feature] === true;

export const UPGRADE_MESSAGE = "Эта функция доступна в полной версии EMC Toolkit для Windows.";

