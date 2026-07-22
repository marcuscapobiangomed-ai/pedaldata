const CONTENT_TYPE_RULES = [
  {
    type: "comparativo",
    match: /( vs | versus |comparativo|comparar|diferen[çc]as entre|melhor entre)/i,
  },
  {
    type: "review",
    match: /(review|ficha t[ée]cnica|vale a pena|an[aá]lise|vale o investimento)/i,
  },
  {
    type: "guia-tecnico",
    match: /(como fazer|guia t[ée]cnico|manuten[çc][aã]o|ajuste|setup|montagem)/i,
  },
  {
    type: "noticia",
    match: /(lan[çc]amento|novidade|anunciad[oa]|worldtour|temporada|not[ií]cia)/i,
  },
  {
    type: "guia-de-compra",
    match: /(guia|melhor|melhores|como escolher|quanto custa|or[çc]amento|tamanho certo)/i,
  },
];

function prettyJson(value) {
  if (value === undefined || value === null || value === "") return "null";
  if (typeof value === "string") return JSON.stringify(value);
  return JSON.stringify(value, null, 2);
}

export function inferContentType(topic) {
  const text = String(topic || "");
  const hit = CONTENT_TYPE_RULES.find((rule) => rule.match.test(text));
  return hit?.type || "guia-de-compra";
}

export function buildSystemPrompt() {
  return [
    "Você é o redator assistente do Pedal Data, um blog brasileiro de ciclismo de estrada orientado a dados, comparação e decisão de compra.",
    "Seu trabalho é produzir conteúdo tecnicamente útil, honesto, direto e fácil de revisar por humanos.",
    "",
    "Regras absolutas:",
    "- use somente informações presentes na ficha de pesquisa e no briefing do tema;",
    "- nunca invente preço, peso, geometria, compatibilidade, garantia, disponibilidade, fontes ou experiência prática;",
    "- se faltar dado indispensável, retorne PESQUISA INSUFICIENTE;",
    "- em análise documental, nunca diga que testou o produto;",
    "- não use linguagem publicitária, superlativos vazios ou citações inventadas;",
    "- escreva em português do Brasil, com frases curtas e parágrafos objetivos;",
    "- quando houver incerteza, declare a limitação claramente;",
    "- use o mercado brasileiro como referência padrão;",
    "- toda conclusão deve ser sustentada por critérios explícitos.",
    "",
    "Prioridades editoriais do Pedal Data:",
    "- comparativos com tabela e veredito claro;",
    "- guias evergreen de compra e decisão;",
    "- dados de mercado e leitura editorial;",
    "- reviews documentais com pontos fortes, limitações e alternativas;",
    "- notícias apenas quando houver anúncio ou confirmação oficial.",
    "",
    "Você deve responder apenas com JSON válido.",
  ].join("\n");
}

export function buildUserPrompt({ topic, researchData, contentType, template, today }) {
  const researchBlock =
    researchData === undefined || researchData === null || researchData === ""
      ? "Nenhuma ficha adicional fornecida."
      : prettyJson(researchData);

  const requiredStructure = template.structure.map((step, index) => `${index + 1}. ${step}`).join("\n");

  return [
    "## FICHA DE PESQUISA",
    `Tema: ${JSON.stringify(topic)}`,
    `Data de produção: ${today}`,
    `Tipo editorial inferido: ${contentType}`,
    `Template editorial: ${template.label}`,
    "",
    "### Informações disponíveis",
    researchBlock,
    "",
    "### Estrutura obrigatória",
    requiredStructure,
    "",
    "### Saída esperada",
    "Se a pesquisa for suficiente, retorne um único objeto JSON com estes campos:",
    "{",
    '  "status": "RASCUNHO GERADO",',
    '  "title": "Título do artigo",',
    '  "description": "Meta descrição SEO entre 140 e 160 caracteres",',
    '  "slug": "slug-em-kebab-case",',
    '  "category": "reviews | comparativos | guias-de-compra | guia-tecnico | noticias",',
    '  "content_type": "review | comparativo | guia-de-compra | guia-tecnico | noticia",',
    '  "review_method": "desk-research | hands-on-test",',
    '  "tested_by_pedaldata": false,',
    '  "methodologyNotice": "Aviso metodológico curto em português",',
    '  "brand": "Nome da marca ou vazio",',
    '  "product_name": "Nome do produto ou tema principal",',
    '  "model_year": 2026,',
    '  "market": "Brasil",',
    '  "weight": "Não informado",',
    '  "weight_source": "Fabricante | Distribuidor | Não informado",',
    '  "price_min": 0,',
    '  "price_max": 0,',
    '  "price_currency": "BRL",',
    '  "price_checked_at": "YYYY-MM-DD",',
    '  "affiliate_links": false,',
    '  "tags": ["ciclismo", "categoria", "assunto"],',
    '  "sources": [',
    '    { "name": "Fonte", "type": "manufacturer", "url": "https://...", "accessed_at": "YYYY-MM-DD" }',
    "  ],",
    '  "frontmatter": {',
    '    "author": "Equipe Pedal Data",',
    '    "image": "/assets/img/logo.svg",',
    '    "image_alt": "Texto alternativo descritivo",',
    '    "image_caption": "",',
    '    "image_credit": "Pedal Data",',
    '    "image_license": "Uso editorial do Pedal Data"',
    "  },",
    '  "sections": [',
    '    { "heading": "Aviso de metodologia", "content": "..." }',
    "  ],",
    '  "imagePlan": [',
    '    { "position": "hero", "purpose": "Função editorial da imagem", "aspectRatio": "16:9", "altSuggestion": "Texto alternativo", "allowedSource": "manufacturer-authorized", "aiGeneratedAllowed": false }',
    "  ],",
    '  "claimsRequiringReview": []',
    "}",
    "",
    "Se a pesquisa for insuficiente, retorne um objeto JSON com:",
    '{ "status": "PESQUISA INSUFICIENTE", "missing_info": ["..."], "unsupported_claims": ["..."] }',
    "",
    "Não inclua markdown fora dos campos JSON.",
  ].join("\n");
}

export function buildRepairPrompt({ topic, rawText, validationError, contentType, template, today }) {
  return [
    "Você vai corrigir a resposta JSON de um artigo do Pedal Data.",
    "A resposta anterior está inválida. Corrija e devolva apenas JSON válido.",
    "",
    `Tema: ${JSON.stringify(topic)}`,
    `Data de produção: ${today}`,
    `Tipo editorial inferido: ${contentType}`,
    `Template editorial: ${template.label}`,
    "",
    "Erro de validação:",
    validationError,
    "",
    "Resposta original:",
    rawText,
    "",
    "Regras:",
    "- mantenha apenas informações verificáveis;",
    "- preserve o máximo possível do conteúdo útil já fornecido;",
    "- corrija campos faltantes ou inválidos;",
    "- se ainda faltar informação indispensável, retorne PESQUISA INSUFICIENTE;",
    "- não adicione markdown fora do JSON.",
  ].join("\n");
}
