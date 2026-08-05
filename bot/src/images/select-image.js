const STOP = new Set(["para", "como", "entre", "sobre", "thebiker", "tecnica", "tecnico", "ajuste", "analise", "produto", "bike", "linha", "real", "massa", "perfil", "configuracao", "catalogo", "ativo", "diferencas", "carga"]);
const SYNONYMS = {
  cambio: ["cambio", "di2", "axs", "transmissao", "sram", "shimano"],
  freio: ["freio", "rotor", "pastilha", "pinça", "disco"],
  pinca: ["freio", "rotor", "pastilha", "pinça", "disco"],
  rolamento: ["rolamento", "direcao", "movimento", "cubo"],
  tubeless: ["tubeless", "pneu", "selante", "fita"],
  suspensao: ["suspensao", "amortecedor", "shock", "spark", "fox", "rockshox"],
  carbono: ["carbono", "hmf", "hmx", "quadro", "scott"],
  rodas: ["roda", "aro", "syncros", "mavic", "zipp", "dt swiss"],
  torque: ["torquimetro", "ferramenta", "park tool", "muc-off"],
  corrente: ["corrente", "cassete", "coroa", "transmissao"],
  pneu: ["pneu", "maxxis", "schwalbe", "pirelli", "continental", "vittoria"],
};
const REQUIRED_GROUPS = {
  spark: ["spark"], addict: ["addict"], scale: ["scale"], foil: ["foil"], syncros: ["syncros"],
  cambio: ["cambio", "di2", "axs", "transmissao"],
  rolamento: ["rolamento"],
  pinca: ["pinca", "pastilha", "rotor", "freio"],
  rotor: ["rotor", "disco", "freio"],
  tubeless: ["tubeless", "selante", "pneu"],
  torque: ["torque", "torquimetro", "pasta carbono"],
  corrente: ["corrente", "cassete", "coroa"],
  pneu: ["pneu"],
  rodas: ["roda", "aro"],
  hmf: ["hmf", "hmx", "carbono"],
  hmx: ["hmf", "hmx", "carbono"],
};

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function terms(item) {
  const raw = normalize(`${item.title} ${item.summary}`).split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !STOP.has(word));
  const expanded = new Set(raw);
  for (const word of raw) for (const synonym of SYNONYMS[word] || []) expanded.add(normalize(synonym));
  return expanded;
}

function hasTerm(haystack, term) {
  const normalized = normalize(term);
  if (normalized.includes(" ")) return haystack.includes(normalized);
  const words = new Set(haystack.split(/[^a-z0-9]+/).filter(Boolean));
  return words.has(normalized) || (normalized.length >= 7 && haystack.includes(normalized));
}

function score(itemTerms, product) {
  const haystack = normalize(`${product.name} ${product.brand || ""} ${product.category} ${product.productUrl}`);
  let value = 0;
  for (const term of itemTerms) if (hasTerm(haystack, term)) value += term.length >= 6 ? 3 : 2;
  return value;
}

function requiredMatches(item, product) {
  const text = normalize(`${item.title} ${item.summary}`);
  const productText = normalize(`${product.name} ${product.productUrl}`);
  const active = Object.entries(REQUIRED_GROUPS).filter(([key]) => text.includes(key));
  if (active.length === 0) return true;
  const modelGroups = active.filter(([key]) => ["spark", "addict", "scale", "foil"].includes(key));
  if (modelGroups.length > 0 && !modelGroups.some(([, values]) => values.some((value) => hasTerm(productText, value)))) return false;
  const conceptGroups = active.filter(([key]) => !["spark", "addict", "scale", "foil"].includes(key));
  return conceptGroups.length === 0 || conceptGroups.some(([, values]) => values.some((value) => hasTerm(productText, value)));
}

export function selectImageCandidate(item, catalog, library) {
  const usedPages = new Set((library.assets || []).flatMap((asset) =>
    (asset.uses || []).some((use) => use.postId !== item.id) ? [asset.sourcePageUrl] : [],
  ));
  const exact = catalog.products.filter((product) => item.productIds.includes(product.id));
  const candidates = exact.length > 0 ? exact.map((product) => ({ product, matchLevel: "exact-id", score: 100 })) : catalog.products
    .filter((product) => requiredMatches(item, product))
    .map((product) => ({ product, matchLevel: "deterministic-topic", score: score(terms(item), product) }))
    .filter((candidate) => candidate.score >= 3)
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name, "pt-BR"));
  const fresh = candidates.find((candidate) => !usedPages.has(candidate.product.productUrl));
  return fresh || candidates[0] || null;
}

export function preferLargestStoreImage(url) {
  return String(url).replace(/-480-0(?=\.[^.]+$)/, "-640-0");
}
