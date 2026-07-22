function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim() || fallback;
}

function fallbackCover(contentType) {
  const fallbacks = {
    comparativo: {
      hero: "/assets/img/system/covers/comparativo/hero.webp",
      thumbnail: "/assets/img/system/covers/comparativo/thumb-480.webp",
    },
    review: {
      hero: "/assets/img/system/covers/review/hero.webp",
      thumbnail: "/assets/img/system/covers/review/thumb-480.webp",
    },
    "guia-de-compra": {
      hero: "/assets/img/system/covers/guia/hero.webp",
      thumbnail: "/assets/img/system/covers/guia/thumb-480.webp",
    },
    "guia-tecnico": {
      hero: "/assets/img/system/covers/guia/hero.webp",
      thumbnail: "/assets/img/system/covers/guia/thumb-480.webp",
    },
    noticia: {
      hero: "/assets/img/system/covers/guia/hero.webp",
      thumbnail: "/assets/img/system/covers/guia/thumb-480.webp",
    },
  };

  return fallbacks[contentType] || fallbacks["guia-de-compra"];
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
  const preset = fallbackCover(article?.content_type);
  const heroPath = safeText(frontmatter.image, preset.hero) === "/assets/img/logo.svg"
    ? preset.hero
    : safeText(frontmatter.image, preset.hero);
  const thumbPath = safeText(frontmatter.thumbnail, preset.thumbnail) === "/assets/img/logo.svg"
    ? preset.thumbnail
    : safeText(frontmatter.thumbnail, preset.thumbnail);
  const heroFile = heroPath.split("/").pop() || "hero.webp";
  const thumbFile = thumbPath.split("/").pop() || "thumb-480.webp";
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
