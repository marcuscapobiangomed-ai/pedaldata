/**
 * Templates editoriais por tipo de publicação
 * Conforme o Manual Editorial do Pedal Data (seções 3.1 a 3.6)
 */

export const TEMPLATES = {
  "review-hands-on": {
    label: "Review com teste real (3.1)",
    required_fields: [
      "test_duration", "test_distance", "test_terrain", "test_weather",
      "test_bike_size", "test_config", "test_rider_weight", "test_measurement_gear"
    ],
    required_disclosures: [
      "quem realizou o teste",
      "período do teste",
      "distância percorrida",
      "terreno",
      "condições climáticas",
      "tamanho da bicicleta",
      "configuração utilizada",
      "peso do ciclista (quando relevante)",
      "equipamentos de medição",
      "limitações do teste",
      "fotos próprias",
    ],
    allowed_phrases: [
      "Durante o teste…",
      "Sentimos maior estabilidade…",
      "Em nossas medições…",
      "Após X quilômetros de uso…",
    ],
    structure: [
      "Aviso de metodologia (como testamos)",
      "Resumo inicial",
      "Veredito rápido",
      "Ficha técnica",
      "Contexto do teste (quem, onde, quando, condições)",
      "Análise por critérios",
      "Para quem é indicado",
      "Para quem pode não ser indicado",
      "Pontos fortes específicos",
      "Limitações específicas",
      "Comparação com alternativas",
      "Preço e disponibilidade no Brasil",
      "Conclusão",
      "Perguntas frequentes",
      "Fontes e metodologia",
    ],
  },

  "review-desk": {
    label: "Review documental (3.2)",
    methodology_notice: "Este artigo é uma análise documental baseada em especificações oficiais e pesquisa de mercado. O produto não foi testado presencialmente pela equipe.",
    allowed_phrases: [
      "A ficha técnica indica…",
      "Segundo o fabricante…",
      "Em teoria, essa geometria tende a…",
      "Com base nas especificações…",
      "Não foi possível confirmar…",
    ],
    forbidden_phrases: [
      "Testamos…",
      "Sentimos…",
      "Durante o pedal…",
      "Nossa experiência com a bicicleta…",
    ],
    required_categories: {
      bike: ["quadro", "geometria", "conforto", "transmissão", "frenagem", "rodas", "pneus", "upgrade", "manutenção", "garantia", "revenda", "custo-benefício"],
      component: ["compatibilidade", "peso", "instalação", "durabilidade", "manutenção", "desempenho", "limitações", "concorrentes", "custo-benefício"],
      accessory: ["segurança", "conforto", "ajuste", "materiais", "certificações", "durabilidade", "facilidade de uso", "garantia", "preço"],
    },
    structure: [
      "Aviso de metodologia",
      "Resumo inicial",
      "Veredito rápido",
      "Ficha técnica com fontes",
      "Contexto do produto",
      "Análise por critérios",
      "Para quem é indicado",
      "Para quem pode não ser indicado",
      "Pontos fortes",
      "Limitações",
      "Comparação com alternativas (mínimo 2)",
      "Preço e disponibilidade no Brasil",
      "Conclusão",
      "Perguntas frequentes",
      "Fontes e metodologia",
    ],
  },

  "comparativo": {
    label: "Comparativo (3.3)",
    required_per_product: [
      "versão exata",
      "ano do modelo",
      "faixa de preço",
      "peso",
      "geometria",
      "grupo de transmissão",
      "rodas",
      "pneus",
      "garantia",
      "disponibilidade",
      "perfil de uso",
    ],
    result_categories: [
      "melhor para iniciantes",
      "melhor para subidas",
      "melhor para longas distâncias",
      "melhor custo-benefício",
      "melhor para competição",
      "melhor para manutenção simples",
    ],
    structure: [
      "Aviso de metodologia",
      "Resumo inicial",
      "Veredito rápido",
      "Tabela comparativa com os mesmos critérios",
      "Análise individual de cada produto",
      "Comparação critério a critério",
      "Vencedor por categoria",
      "Conclusão por tipo de ciclista",
      "Tabela de especificações",
      "Fontes e metodologia",
    ],
  },

  "guia-de-compra": {
    label: "Guia de compra (3.4)",
    required_definitions: [
      "público-alvo",
      "orçamento",
      "uso pretendido",
      "critérios de seleção",
      "data da pesquisa",
      "produtos considerados",
      "produtos excluídos e por quê",
    ],
    structure: [
      "Aviso de metodologia",
      "Definição do público e orçamento",
      "Critérios de seleção",
      "Metodologia da pesquisa",
      "Lista de produtos recomendados (com justificativa)",
      "Comparativo entre as opções",
      "Para quem cada opção é melhor",
      "FAQ",
      "Fontes e metodologia",
    ],
  },

  "guia-tecnico": {
    label: "Guia técnico (3.5)",
    required_sections: [
      "explicação simples do conceito",
      "termos técnicos explicados na primeira aparição",
      "exemplos práticos",
      "erros comuns",
      "alertas de segurança",
      "quando procurar um mecânico",
      "referências utilizadas",
    ],
    structure: [
      "Aviso de metodologia",
      "O que é / Para que serve",
      "Termos técnicos essenciais",
      "Passo a passo ou explicação detalhada",
      "Erros comuns e como evitá-los",
      "Alertas de segurança",
      "Quando procurar ajuda profissional",
      "FAQ",
      "Fontes e referências",
    ],
  },

  "noticia": {
    label: "Notícia ou lançamento (3.6)",
    required_distinctions: [
      "informação oficial",
      "rumor",
      "vazamento",
      "expectativa editorial",
      "disponibilidade confirmada",
      "preço confirmado",
      "estimativa",
    ],
    rules: [
      "Nunca tratar expectativa como lançamento confirmado",
      'Títulos como "Produto X 2027 é lançado" só com anúncio oficial',
      "Sem confirmação, usar título como 'Possível novo Produto X: o que já sabemos e o que ainda é rumor'",
    ],
    structure: [
      "Aviso de metodologia",
      "O que foi anunciado (com fonte)",
      "O que é confirmado vs. o que é especulação",
      "Contexto e relevância para o mercado brasileiro",
      "Preço e disponibilidade (quando confirmados)",
      "Expectativas editoriais (claramente identificadas)",
      "FAQ",
      "Fontes",
    ],
  },
};

export function getTemplate(type) {
  const aliases = {
    review: "review-desk",
    "review-desk": "review-desk",
    "review-hands-on": "review-hands-on",
    comparativo: "comparativo",
    "guia-de-compra": "guia-de-compra",
    "guia-tecnico": "guia-tecnico",
    noticia: "noticia",
  };

  const key = aliases[type] || type;
  return TEMPLATES[key] || TEMPLATES["review-desk"];
}

export function buildResearchSheet({ type, product_name, brand, model_year, sources, prices, specs }) {
  const template = getTemplate(type);
  const lines = [
    "=== FICHA DE PESQUISA ESTRUTURADA ===",
    "",
    `Tipo editorial: ${template.label}`,
    `Produto: ${product_name || "Não informado"}`,
    `Marca: ${brand || "Não informado"}`,
    `Ano: ${model_year || "Não informado"}`,
    "",
    "--- FONTES OFICIAIS ---",
  ];

  if (sources?.official?.length) {
    sources.official.forEach((s) => lines.push(`- [OFICIAL] ${s.name}: ${s.url} (acessado em ${s.accessed_at})`));
  } else {
    lines.push("- Nenhuma fonte oficial fornecida");
  }

  lines.push("", "--- FONTES SECUNDÁRIAS ---");
  if (sources?.secondary?.length) {
    sources.secondary.forEach((s) => lines.push(`- ${s.name}: ${s.url} (${s.type})`));
  } else {
    lines.push("- Nenhuma fonte secundária fornecida");
  }

  lines.push("", "--- PREÇOS CONSULTADOS ---");
  if (prices?.length) {
    prices.forEach((p) => {
      lines.push(`- Loja: ${p.store} | Versão: ${p.version} | Preço: ${p.currency} ${p.value} | Data: ${p.date} | Frete: ${p.includes_shipping ? "incluído" : "não informado"} | Promocional: ${p.is_promotional ? "sim" : "não"}`);
    });
  } else {
    lines.push("- Nenhum preço consultado");
  }

  lines.push("", "--- ESPECIFICAÇÕES TÉCNICAS ---");
  if (specs) {
    Object.entries(specs).forEach(([key, value]) => {
      lines.push(`- ${key}: ${value || "Não informado"}`);
    });
  } else {
    lines.push("- Nenhuma especificação fornecida");
  }

  lines.push("", "--- CAMPOS OBRIGATÓRIOS PARA ESTE TIPO ---");
  if (template.required_fields) {
    template.required_fields.forEach((f) => lines.push(`- ${f}: `));
  }

  return lines.join("\n");
}
