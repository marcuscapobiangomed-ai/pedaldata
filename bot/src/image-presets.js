const DEFAULT_COVER = {
  hero: "/assets/img/system/covers/guia/hero.webp",
  thumbnail: "/assets/img/system/covers/guia/thumb-480.webp",
};

const CONTENT_TYPE_PRESETS = {
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

export function getCoverPreset(contentType = "guia-de-compra") {
  return CONTENT_TYPE_PRESETS[contentType] || DEFAULT_COVER;
}
