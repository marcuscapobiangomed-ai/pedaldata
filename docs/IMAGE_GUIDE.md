# Guia de Imagens — Pedal Data

## Estrutura

```
assets/img/posts/<slug>/
├── hero.jpg
├── thumb-480.webp
└── image-manifest.json
```

## image-manifest.json

```json
{
  "hero": {
    "file": "hero.jpg",
    "source": "Scott Sports",
    "sourceUrl": "https://...",
    "license": "Uso editorial autorizado",
    "credit": "Scott Sports",
    "alt": "Scott Addict 20 2026 vista lateral",
    "width": 1200,
    "height": 675
  },
  "variants": {
    "thumb-480": {
      "file": "thumb-480.webp",
      "width": 480,
      "height": 320,
      "sizeKB": 17,
      "quality": 82
    }
  }
}
```

## Requisitos

- **Hero**: 1200×675px, JPG ou WebP, < 300 KB, `loading="eager"` + `fetchpriority="high"`
- **Thumbnail**: 480×320px, WebP, < 150 KB, `loading="lazy"`
- **Alt text**: descritivo, ≥ 10 caracteres, sem "imagem de" ou "foto de"
- **Licença**: sempre registrada no hero do manifest
- **Crédito**: obrigatório para imagens de terceiros
- **sourceUrl**: recomendado quando houver URL pública de referência; opcional em imagens internas ou geradas pela equipe

## Bloqueios

A publicação falha se:
- imagem sem crédito
- alt ausente ou genérico
- arquivo > 300 KB
- proporção diferente de 16:9
