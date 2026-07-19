# Guia de Imagens — Pedal Data

## Estrutura

```
assets/img/posts/<slug>/
├── hero-1600.webp
├── spec-1.webp
└── image-manifest.json
```

## image-manifest.json

```json
{
  "hero": {
    "file": "hero-1600.webp",
    "source": "Scott Sports",
    "sourceUrl": "https://...",
    "license": "Uso editorial autorizado",
    "credit": "Scott Sports",
    "alt": "Scott Addict 20 2026 vista lateral",
    "width": 1600,
    "height": 900
  }
}
```

## Requisitos

- **Hero**: 1600×900px, WebP, < 200 KB, `loading="eager"` + `fetchpriority="high"`
- **Spec**: 1200×675px, WebP, < 150 KB, `loading="lazy"`
- **Alt text**: descritivo, ≥ 10 caracteres, sem "imagem de" ou "foto de"
- **Licença**: sempre registrada no manifest
- **Crédito**: obrigatório para imagens de terceiros

## Bloqueios

A publicação falha se:
- imagem sem crédito
- origem vazia
- alt ausente ou genérico
- arquivo > 300 KB
- proporção diferente de 16:9
- formato diferente de WebP
