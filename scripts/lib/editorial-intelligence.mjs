const STOPWORDS = new Set(['para', 'como', 'com', 'uma', 'das', 'dos', 'que', 'por', 'thebiker', 'bike', 'bikes', 'ciclismo']);
const DEFAULT_CYCLING_TERMS = [
  'ciclismo',
  'ciclista',
  'bicicleta',
  'mountain bike',
  'mtb',
  'gravel',
  'bike fit',
  'suspensão',
  'pedal',
  'downhill',
  'enduro',
  'cross country',
];
const MOTORIZED_FALSE_POSITIVES = /\b(dirt bike|motocross|motorcycle|motorbike|motocicleta|surron|sur ron|pit bike|mini bike|quadriciclo|atv|\d{2,4}\s*cc)\b/;

export function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowKey(row) {
  return `${row.keys?.[0] || ''}|${row.keys?.[1] || ''}`;
}

function isCyclingVideo(video, config) {
  const haystack = normalizeText(`${video.snippet?.title || video.title} ${video.snippet?.description || ''}`);
  if (MOTORIZED_FALSE_POSITIVES.test(haystack)) return false;
  const terms = Array.isArray(config.cyclingTerms) && config.cyclingTerms.length > 0
    ? config.cyclingTerms
    : DEFAULT_CYCLING_TERMS;
  return terms.some((term) => haystack.includes(normalizeText(term)));
}

export function technicalTopicFromVideo(value) {
  const text = normalizeText(value);
  if (/fat bike|pneu largo|wide tire/.test(text)) return 'Fat bikes: largura de pneus, pressão, tração e limites de uso';
  if (/suspens|fork|garfo|shock|amortec|sag|downhill/.test(text)) return 'Suspensão de mountain bike: ajuste, diagnóstico e limites de aplicação';
  if (/bike fit|posicao|position|reach|stack|cockpit|selim/.test(text)) return 'Bike fit e posição: critérios técnicos para ajuste e distribuição de carga';
  if (/gravel/.test(text)) return 'Bicicletas gravel: geometria, pneus, transmissão e critérios de uso';
  if (/electric|e bike|ebike|eletrica/.test(text)) return 'Bicicletas elétricas: arquitetura, autonomia, limites e critérios técnicos';
  if (/freio|brake|rotor|pastilha/.test(text)) return 'Freios de bicicleta: diagnóstico, ajuste e controle térmico';
  if (/pneu|tire|tubeless|pressao/.test(text)) return 'Pneus de bicicleta: pressão, carcaça, aderência e resistência ao rolamento';
  if (/cambio|transmiss|cassete|corrente|chain|shift|grupo/.test(text)) return 'Transmissão da bicicleta: ajuste, desgaste e diagnóstico sob carga';
  if (/roda|wheel|aro|hub|cubo/.test(text)) return 'Rodas de bicicleta: rigidez, massa, largura e compatibilidade';
  if (/bmx/.test(text)) return 'BMX e mountain bike: diferenças de geometria, componentes e aplicação';
  if (/crianca|kid|child|family/.test(text)) return 'Ciclismo com crianças: ergonomia, segurança e progressão técnica';
  if (/limpeza|clean|oil|lubr|manutenc|maintenance/.test(text)) return 'Manutenção preventiva da bicicleta: método, frequência e pontos críticos';
  return 'Tendências técnicas do ciclismo: como separar evidência, aplicação e apelo de mercado';
}

function hasBlockedBrand(value, config) {
  const haystack = normalizeText(value);
  return (config.blockedPromotionBrands || []).some((brand) => haystack.includes(normalizeText(brand)));
}

function videoOpportunity(video, context, config) {
  const title = video.snippet?.title || video.title || 'Vídeo sem título';
  const publishedAt = video.snippet?.publishedAt || context.generatedAt;
  const ageDays = Math.max(1, (new Date(context.generatedAt) - new Date(publishedAt)) / 86400000);
  const views = number(video.statistics?.viewCount || video.viewCount);
  const likes = number(video.statistics?.likeCount || video.likeCount);
  const comments = number(video.statistics?.commentCount || video.commentCount);
  const viewsPerDay = views / ageDays;
  return {
    source: 'youtube',
    topic: technicalTopicFromVideo(title),
    signalTitle: title,
    sourceUrl: `https://www.youtube.com/watch?v=${video.id}`,
    score: Math.round(Math.log10(viewsPerDay + 1) * 24 + Math.min(20, ((likes + comments * 2) / Math.max(1, views)) * 1000)),
    evidence: `${views.toLocaleString('pt-BR')} visualizações; ${Math.round(viewsPerDay).toLocaleString('pt-BR')} por dia`,
    views,
    viewsPerDay: Math.round(viewsPerDay),
    directPromotionAllowed: false,
    blockedBrandDetected: hasBlockedBrand(title, config),
  };
}

function gscOpportunity(row, previousMap) {
  const query = row.keys?.[0] || '';
  const page = row.keys?.[1] || '';
  const previous = previousMap.get(rowKey(row));
  const impressions = number(row.impressions);
  const priorImpressions = number(previous?.impressions);
  const delta = priorImpressions > 0 ? (impressions - priorImpressions) / priorImpressions : impressions > 0 ? 1 : 0;
  const position = number(row.position);
  const ctr = number(row.ctr);
  const positionOpportunity = position >= 4 && position <= 20 ? 22 - position : 0;
  const score = Math.round(Math.log10(impressions + 1) * 25 + Math.max(-10, Math.min(20, delta * 20)) + positionOpportunity + Math.max(0, 8 - ctr * 100));
  return {
    source: 'search-console',
    topic: query,
    targetUrl: page,
    sourceUrl: page,
    score,
    evidence: `${Math.round(impressions)} impressões; posição ${position.toFixed(1)}; CTR ${(ctr * 100).toFixed(1)}%; variação ${(delta * 100).toFixed(0)}%`,
    impressions,
    position,
    ctr,
    delta,
    directPromotionAllowed: true,
  };
}

function covered(topic, articles) {
  const tokens = normalizeText(topic).split(' ').filter((token) => token.length >= 4 && !STOPWORDS.has(token));
  if (tokens.length === 0) return null;
  return articles.find((article) => {
    const text = normalizeText(`${article.title} ${(article.tags || []).join(' ')}`);
    const matches = tokens.filter((token) => text.includes(token)).length;
    return matches >= Math.min(2, tokens.length);
  }) || null;
}

function briefFrom(opportunity, articles, config) {
  const existing = covered(opportunity.topic, articles);
  const action = existing ? 'refresh' : 'new-content';
  const safeTopic = opportunity.topic;
  return {
    id: normalizeText(`${opportunity.source}-${safeTopic}`).replace(/ /g, '-').slice(0, 72),
    action,
    topic: safeTopic,
    targetUrl: existing?.url || opportunity.targetUrl || null,
    score: opportunity.score,
    source: opportunity.source,
    audienceSegment: 'core_technical_cyclists',
    audienceIntent: opportunity.source === 'search-console' ? 'solve_problem' : 'follow_market_competition',
    experienceLevelTarget: 'intermediate_advanced',
    evidence: opportunity.evidence,
    evidenceUrl: opportunity.sourceUrl,
    signalTitle: opportunity.signalTitle || null,
    angle: existing
      ? 'Atualizar a resposta existente, acrescentar evidência nova e reforçar links internos.'
      : 'Criar resposta técnica original para ciclista intermediário ou avançado, com método e limitações declarados.',
    publicationGate: [
      'fontes primárias verificadas',
      'nenhuma experiência ou especificação inventada',
      'produto e CTA somente com inventário TheBiker verificado',
      'gates determinísticos obrigatórios; revisão humana apenas para exceções',
    ],
    allowedBrands: config.portfolioBrands || [],
  };
}

export function buildEditorialIntelligence({ context, config, gscCurrent = [], gscPrevious = [], videos = [], articles = [] }) {
  const previousMap = new Map(gscPrevious.map((row) => [rowKey(row), row]));
  const searchSignals = gscCurrent
    .filter((row) => number(row.impressions) >= (config.minimumImpressions || 5))
    .map((row) => gscOpportunity(row, previousMap));
  const videoSignals = videos
    .filter((video) => isCyclingVideo(video, config))
    .map((video) => videoOpportunity(video, context, config));
  const directCandidates = [...searchSignals, ...videoSignals]
    .filter((item) => item.directPromotionAllowed || item.source === 'youtube')
    .sort((left, right) => right.score - left.score);
  const seen = new Set();
  const briefs = [];
  for (const candidate of directCandidates) {
    const key = normalizeText(candidate.topic).split(' ').filter((token) => token.length >= 4 && !STOPWORDS.has(token)).slice(0, 5).join('-');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    briefs.push(briefFrom(candidate, articles, config));
    if (briefs.length >= (config.maximumBriefs || 12)) break;
  }
  const now = new Date(context.generatedAt);
  const refreshQueue = articles.map((article) => {
    const modified = new Date(article.dateModified || article.datePublished || 0);
    const ageDays = Math.max(0, Math.floor((now - modified) / 86400000));
    const performance = searchSignals.filter((signal) => signal.targetUrl === article.url).sort((a, b) => b.score - a.score)[0];
    return { title: article.title, url: article.url, ageDays, searchOpportunity: performance?.score || 0 };
  }).filter((item) => item.ageDays >= (config.refreshAfterDays || 90) || item.searchOpportunity > 0)
    .sort((left, right) => right.searchOpportunity - left.searchOpportunity || right.ageDays - left.ageDays)
    .slice(0, 15);
  return {
    schemaVersion: 1,
    runKey: context.runKey,
    cadence: context.cadence,
    generatedAt: context.generatedAt,
    periods: context.periods,
    metrics: {
      gscRows: gscCurrent.length,
      youtubeVideos: videos.length,
      publishedArticles: articles.length,
      briefs: briefs.length,
      refreshCandidates: refreshQueue.length,
    },
    briefs,
    refreshQueue,
    marketSignals: videoSignals.slice(0, 20),
    governance: {
      autoPublish: false,
      autoScheduleAfterGates: context.cadence === 'monthly',
      requiresHumanApproval: false,
      exceptionReviewRequired: true,
      competitorPromotionBlocked: true,
      staleCommercialDataFailClosed: true,
      youtubeIsIntelligenceOnly: true,
    },
  };
}

export function intelligenceMarkdown(report) {
  const lines = [
    `# Inteligência editorial ${report.runKey}`,
    '',
    `Cadência: **${report.cadence}** · gerado em ${report.generatedAt}`,
    '',
    `Sinais processados: ${report.metrics.gscRows} linhas do Search Console, ${report.metrics.youtubeVideos} vídeos e ${report.metrics.publishedArticles} artigos publicados.`,
    '',
    '## Pautas priorizadas',
    '',
  ];
  for (const [index, brief] of report.briefs.entries()) {
    lines.push(`${index + 1}. **${brief.topic}** — score ${brief.score} · ${brief.action}`);
    lines.push(`   - Evidência: ${brief.evidence} ([fonte](${brief.evidenceUrl}))`);
    lines.push(`   - Direção: ${brief.angle}`);
    lines.push(`   - Público: ${brief.audienceSegment}; intenção: ${brief.audienceIntent}; nível-alvo: ${brief.experienceLevelTarget}`);
    if (brief.targetUrl) lines.push(`   - Página-alvo: ${brief.targetUrl}`);
  }
  lines.push('', '## Atualizações do acervo', '');
  if (report.refreshQueue.length === 0) lines.push('- Nenhuma página atingiu o limiar nesta execução.');
  for (const item of report.refreshQueue) lines.push(`- [${item.title}](${item.url}) — ${item.ageDays} dias; score de oportunidade ${item.searchOpportunity}`);
  lines.push('', '## Gate editorial', '', report.cadence === 'monthly' ? '- O relatório mensal renova automaticamente a janela de 30 dias; a publicação só ocorre depois dos gates do repositório.' : '- O relatório semanal atualiza a inteligência e não altera sozinho a campanha.', '- Fontes, método, produto, imagem, preço e estoque precisam passar pelos gates do repositório.', '- Exceções ficam bloqueadas para revisão; conteúdo aprovado pelos gates pode ser agendado sem intervenção no Codex.', '- Marcas concorrentes podem servir apenas como sinal de mercado; não viram promoção nem CTA.', '', '<details><summary>Payload estruturado</summary>', '', '```json', JSON.stringify(report, null, 2), '```', '', '</details>');
  return lines.join('\n');
}
