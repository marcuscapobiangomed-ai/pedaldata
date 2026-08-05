import portfolio from "../config/thebiker-portfolio.json" with { type: "json" };

function key(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

const aliases = new Map(
  Object.entries(portfolio.aliases || {}).map(([alias, canonical]) => [key(alias), canonical]),
);
const canonicalBrands = new Map(portfolio.brands.map((brand) => [key(brand), brand]));

export const THEBIKER_PORTFOLIO = Object.freeze(portfolio);

export function canonicalPortfolioBrand(value) {
  const normalized = key(value);
  if (!normalized) return "";
  const alias = aliases.get(normalized);
  if (alias) return alias;
  return canonicalBrands.get(normalized) || "";
}

export function isPortfolioBrand(value) {
  return canonicalPortfolioBrand(value) !== "";
}

export function assertPortfolioPromotion(brands) {
  const values = Array.isArray(brands) ? brands : [brands];
  const requested = values.map((brand) => String(brand || "").trim()).filter(Boolean);
  const blocked = requested.filter((brand) => !isPortfolioBrand(brand));

  if (requested.length === 0) {
    throw new Error("Política TheBiker: informe ao menos uma marca promovida do portfólio.");
  }
  if (blocked.length > 0) {
    throw new Error(`Política TheBiker: promoção bloqueada para marca fora do portfólio: ${blocked.join(", ")}.`);
  }

  return [...new Set(requested.map(canonicalPortfolioBrand))];
}
