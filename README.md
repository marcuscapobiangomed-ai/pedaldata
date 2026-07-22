# 🚴 Pedal Data — Blog de Ciclismo

**Reviews, guias e comparativos de ciclismo de estrada para o mercado brasileiro.**

## Pipeline editorial

```
📱 WhatsApp (/novo <tema>)
        ↓
📊 Ficha de pesquisa (content/research/<slug>.json)
        ↓
🤖 IA gera rascunho estruturado (JSON validado por schema)
        ↓
🖼️ Plano de imagens (assets/img/posts/<slug>/image-manifest.json)
        ↓
✅ Validação automática (research, claims, images, frontmatter)
        ↓
🔀 Pull Request (branch content/<slug>)
        ↓
👀 Revisão humana (checklist no PR)
        ↓
🚀 Merge → publicação
```

### Transparência

- Os artigos são produzidos **com auxílio de inteligência artificial** e revisados editorialmente
- **Nenhum conteúdo é publicado sem revisão humana**
- **Análises documentais** são explicitamente identificadas como tal — não são testes pessoais
- **Especificações técnicas exigem fonte** (fabricante, distribuidor, loja)
- Todo artigo possui `status: draft` até ser aprovado e alterado para `status: published`

### Estrutura do conteúdo

```text
docs/
├── EDITORIAL_GUIDE.md      # Manual editorial completo
├── IMAGE_GUIDE.md           # Guia de imagens
├── SEO_GUIDE.md             # Diretrizes de SEO
└── REVIEW_CHECKLIST.md      # Checklist de revisão

content/
└── research/                # Fichas de pesquisa (JSON validado)

_posts/
└── drafts/                  # Rascunhos aguardando revisão

assets/img/posts/<slug>/
├── image-manifest.json      # Metadados das imagens
└── hero-1600.webp           # Imagem principal
```

## Comandos do WhatsApp

| Comando | Ação |
|---|---|
| `/novo <tema>` | Registrar novo tema e iniciar pipeline |
| `/status <slug>` | Verificar progresso |
| `/aprovar <slug>` | Aprovar para publicação |
| `/cancelar <slug>` | Cancelar tema |
| `/ajuda` | Mostrar ajuda |

## Scripts de validação

```bash
npm run validate:research   # Valida fichas de pesquisa
npm run validate:posts      # Valida frontmatter dos posts
npm run validate:images     # Valida manifests de imagem
npm run check:claims        # Verifica alegações proibidas
npm run test                # Testa schemas + generator
npm run lint                # Verifica sintaxe JS
npm run build:jekyll        # Build do site Jekyll
```

## Setup

```bash
cd bot
cp .env.example .env
# Configure DEEPSEEK_API_KEY (preferencial), GEMINI_API_KEY (fallback), GITHUB_TOKEN, etc.
npm start
```

## Requisitos

- Node.js 18+
- Conta GitHub
- DeepSeek API key
- Google Gemini API key (fallback) (https://aistudio.google.com/apikey)
- WhatsApp no celular
