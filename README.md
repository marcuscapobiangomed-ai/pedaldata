# 🚴 Pedal Data — Blog de Ciclismo Automatizado

**100% gratuito** — Geração de conteúdo via Gemini IA + GitHub Pages

## Fluxo completo

```
📱 Você envia um tema/ideia no WhatsApp
        ↓
🤖 Gemini IA gera artigo completo (review, comparativo, guia)
        ↓
🚀 Publica automaticamente no GitHub Pages
        ↓
🔗 Link do post volta para seu WhatsApp
```

---

## 📋 Plano de Conteúdo — 30 Posts Iniciais

### Bloco 1: Guias de compra (alta intenção de compra)
1. Melhor bike de estrada para iniciantes 2026
2. Melhores bikes até R$ 5.000
3. Melhores bikes até R$ 10.000
4. Scott Addict vs Cervélo Caledonia
5. Trek Émonda vs Specialized Tarmac
6. Carbono vs alumínio: vale a pena?
7. Shimano 105 vs Ultegra
8. Como escolher o tamanho certo
9. Nova vs usada: o que compensa
10. Orçamento completo para primeira bike

### Bloco 2: Marcas e modelos
11. Scott Addict 2026 completa
12. Scott Foil 2026 review
13. Cervélo: a marca dos profissionais
14. Specialized Tarmac SL8
15. Trek Madone vs Émonda
16. Cannondale SuperSix vs SystemSix

### Bloco 3: Lançamentos e tendências
17. Lançamentos 2026
18. Tendências: aero vs leve
19. Equipamentos WorldTour 2026
20. Inovações em componentes

### Bloco 4: Componentes e acessórios
21. Melhores rodas de carbono
22. Pedais clipless para iniciantes
23. Capacetes de ciclismo 2026
24. Sensores de potência valem a pena?
25. Apps de treino comparados
26. Manutenção básica

### Bloco 5: Brasil-específico
27. Onde comprar bike importada no Brasil
28. Importar bike: impostos e custos
29. Melhores rotas no Brasil
30. Bicicletarias por cidade

---

## 💰 Monetização

| Fonte | Como funciona | Potencial |
|-------|--------------|-----------|
| **Amazon Associates** | Links de afiliados nos posts (3-11% comissão) | Alto — bikes têm ticket alto |
| **Google AdSense** | Display ads nas páginas | Complementar |
| **Giro Bike Afiliados** | 5% comissão em loja especializada | Médio |
| **Mercado Livre / Magalu** | Programas de afiliados brasileiros | Médio |
| **Ebook próprio** | "Guia completo da bike de estrada" | Alto (margem 100%) |
| **Parcerias com lojas** | Contato direto com bicicletarias | Alto |

---

## Setup rápido

```bash
cd bot
cp .env.example .env
# Edite o .env com suas chaves
npm start
```

## Gerar os 30 posts de uma vez

```bash
npm run batch:30
```

Isso gera todos os posts em sequência (com intervalo de 5s entre eles para não estourar a cota da Gemini).

## Testar sem WhatsApp

```bash
node src/manual.js "Comparativo: Scott Addict vs Trek Émonda, qual é melhor para subidas?"
```

## Requisitos

- Node.js 18+
- Conta GitHub (grátis)
- Conta Google (grátis, para Gemini API) → https://aistudio.google.com/apikey
- WhatsApp no celular
