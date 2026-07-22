function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim() || fallback;
}

function resolveSource(article, frontmatter) {
  const firstSource = Array.isArray(article.sources) ? article.sources[0] : null;
  return {
    name:
      safeText(frontmatter?.image_credit) ||
      safeText(firstSource?.name) ||
      "Pedal Data",
    url: safeText(firstSource?.url) || "",
    license:
      safeText(frontmatter?.image_license) ||
      "Uso editorial do Pedal Data",
  };
}

export function buildImageManifest(article) {
  const frontmatter = article?.frontmatter || {};
  const sources = resolveSource(article, frontmatter);
  const heroFile = safeText(frontmatter.image, "").split("/").pop() || "hero.jpg";
  const thumbFile =
    safeText(frontmatter.thumbnail, "").split("/").pop() || "thumb-480.webp";
  const title = safeText(article?.title, "Imagem principal do artigo");
  const alt = safeText(frontmatter.image_alt, "") || title;
  const hero = {
    file: heroFile,
    source: sources.name,
    sourceUrl: sources.url,
    license: sources.license,
    credit: sources.name,
    alt,
    width: 1200,
    height: 675,
  };

  const variants = {
    "thumb-480": {
      file: thumbFile,
      width: 480,
      height: 320,
      sizeKB: 0,
      quality: 82,
    },
  };

  return { hero, variants };
}
