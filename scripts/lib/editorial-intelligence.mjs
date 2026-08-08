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
const VIDEO_SEO_NOISE = new Set(['best', 'new', 'review', 'official', 'video', 'shorts', 'available', 'india', 'world', 'bike', 'bikes', 'bicycle', 'cycling', 'mtb']);

export function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowKey(row) {
  return (row.keys || []).join('|');
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
  const capturedMarkets = [...new Set(video._intelligence?.markets || [])].sort();
  const capturedLanguages = [...new Set(video._intelligence?.languages || [])].sort();
  return {
    source: 'youtube',
    topic: technicalTopicFromVideo(title),
    signalTitle: title,
    channelTitle: video.snippet?.channelTitle || null,
    publishedAt,
    sourceUrl: `https://www.youtube.com/watch?v=${video.id}`,
    score: Math.round(Math.log10(viewsPerDay + 1) * 24 + Math.min(20, ((likes + comments * 2) / Math.max(1, views)) * 1000) + Math.min(10, capturedMarkets.length * 2)),
    evidence: `${views.toLocaleString('pt-BR')} visualizações; ${Math.round(viewsPerDay).toLocaleString('pt-BR')} por dia; captado em ${capturedMarkets.length || 1} mercado(s)`,
    views,
    likes,
    comments,
    viewsPerDay: Math.round(viewsPerDay),
    capturedMarkets,
    capturedLanguages,
    directPromotionAllowed: false,
    blockedBrandDetected: hasBlockedBrand(title, config),
  };
}

function gscOpportunity(row, previousMap) {
  const query = row.keys?.[0] || '';
  const page = row.keys?.[1] || '';
  const country = row.keys?.[2] || 'not-segmented';
  const previous = previousMap.get(rowKey(row));
  const clicks = number(row.clicks);
  const impressions = number(row.impressions);
  const priorImpressions = number(previous?.impressions);
  const delta = priorImpressions > 0 ? (impressions - priorImpressions) / priorImpressions : impressions > 0 ? 1 : 0;
  const position = number(row.position);
  const ctr = number(row.ctr);
  const positionOpportunity = position >= 4 && position <= 20 ? 22 - position : 0;
  const score = Math.round(Math.log10(impressions + 1) * 25 + Math.max(-10, Math.min(20, delta * 20)) + positionOpportunity + Math.max(0, 8 - ctr * 100));
  return {
    source: 'search-console',
    query,
    topic: query,
    targetUrl: page,
    sourceUrl: page,
    country,
    score,
    evidence: `${Math.round(impressions)} impressões; posição ${position.toFixed(1)}; CTR ${(ctr * 100).toFixed(1)}%; variação ${(delta * 100).toFixed(0)}%`,
    clicks,
    impressions,
    priorImpressions,
    position,
    ctr,
    delta,
    directPromotionAllowed: true,
  };
}

function seoPhraseFromVideo(signal, config) {
  const blocked = new Set((config.blockedPromotionBrands || []).flatMap((brand) => normalizeText(brand).split(' ')));
  const words = normalizeText(signal.signalTitle).split(' ').filter((word) => word.length >= 3 && !VIDEO_SEO_NOISE.has(word) && !blocked.has(word) && !/^\d+$/.test(word));
  return words.slice(0, 8).join(' ') || normalizeText(signal.topic);
}

function buildSeoRanking(searchSignals, videoSignals, config, limit = 10) {
  const groups = new Map();
  for (const signal of searchSignals) {
    const key = normalizeText(signal.query);
    if (!key) continue;
    const group = groups.get(key) || {
      term: signal.query,
      source: 'search-console',
      clicks: 0,
      impressions: 0,
      priorImpressions: 0,
      weightedPosition: 0,
      countries: new Set(),
      targetUrls: new Set(),
      opportunityScore: 0,
    };
    group.clicks += signal.clicks;
    group.impressions += signal.impressions;
    group.priorImpressions += signal.priorImpressions;
    group.weightedPosition += signal.position * Math.max(1, signal.impressions);
    if (signal.country && signal.country !== 'not-segmented') group.countries.add(signal.country);
    if (signal.targetUrl) group.targetUrls.add(signal.targetUrl);
    group.opportunityScore = Math.max(group.opportunityScore, signal.score);
    groups.set(key, group);
  }
  const ranked = [...groups.values()].map((group) => {
    const ctr = group.impressions > 0 ? group.clicks / group.impressions : 0;
    const position = group.weightedPosition / Math.max(1, group.impressions);
    const delta = group.priorImpressions > 0
      ? (group.impressions - group.priorImpressions) / group.priorImpressions
      : group.impressions > 0 ? 1 : 0;
    const countries = [...group.countries].sort();
    return {
      term: group.term,
      source: group.source,
      scope: 'demanda global observada no site',
      clicks: group.clicks,
      impressions: group.impressions,
      ctr,
      position,
      delta,
      countries,
      targetUrls: [...group.targetUrls].sort(),
      opportunityScore: Math.round(group.opportunityScore + Math.min(10, countries.length * 2)),
      recommendedUse: position >= 4 && position <= 20 ? 'Otimizar conteúdo existente e reforçar links internos.' : 'Usar como termo principal ou secundário em pauta tecnicamente aderente.',
    };
  }).sort((left, right) => right.opportunityScore - left.opportunityScore || right.impressions - left.impressions);
  const seen = new Set(ranked.map((item) => normalizeText(item.term)));
  for (const signal of videoSignals) {
    if (ranked.length >= limit) break;
    const term = seoPhraseFromVideo(signal, config);
    if (!term || seen.has(normalizeText(term))) continue;
    seen.add(normalizeText(term));
    ranked.push({
      term,
      source: 'youtube-global-derived',
      scope: 'proxy de intenção global derivado do YouTube',
      clicks: null,
      impressions: null,
      ctr: null,
      position: null,
      delta: null,
      countries: signal.capturedMarkets,
      targetUrls: [],
      evidenceUrl: signal.sourceUrl,
      opportunityScore: signal.score,
      recommendedUse: 'Validar a intenção e usar como pauta ou termo semântico; não tratar como volume de busca do Google.',
    });
  }
  return ranked.slice(0, limit).map((item, index) => ({ rank: index + 1, ...item }));
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
    .map((video) => videoOpportunity(video, context, config))
    .sort((left, right) => right.score - left.score || right.viewsPerDay - left.viewsPerDay || right.views - left.views);
  const topYoutube = videoSignals.slice(0, 10).map((item, index) => ({ rank: index + 1, ...item }));
  const topSeo = buildSeoRanking(searchSignals, videoSignals, config, 10);
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
  const requestedMarkets = (config.youtubeMarkets || []).map((market) => market.regionCode);
  const capturedMarkets = [...new Set(videoSignals.flatMap((signal) => signal.capturedMarkets))].sort();
  const countriesObserved = [...new Set(searchSignals.map((signal) => signal.country).filter((country) => country && country !== 'not-segmented'))].sort();
  return {
    schemaVersion: 2,
    runKey: context.runKey,
    cadence: context.cadence,
    generatedAt: context.generatedAt,
    periods: context.periods,
    scope: {
      label: 'inteligência global multirregional do nicho de ciclismo',
      youtube: {
        method: 'amostra multirregional da YouTube Data API ordenada por visualizações e reclassificada por velocidade, engajamento e recorrência entre mercados',
        marketsRequested: requestedMarkets,
        marketsCaptured: capturedMarkets,
        exactWorldwideTop10: false,
      },
      seo: {
        method: 'consultas do Google Search que exibiram páginas do TheBiker; quando insuficientes, padrões de intenção multirregionais do YouTube entram como proxy explicitamente identificado',
        countriesObserved,
        exactWorldwideSearchVolume: false,
      },
    },
    metrics: {
      gscRows: gscCurrent.length,
      youtubeVideos: videos.length,
      publishedArticles: articles.length,
      briefs: briefs.length,
      refreshCandidates: refreshQueue.length,
      youtubeMarketsCaptured: capturedMarkets.length,
      seoCountriesObserved: countriesObserved.length,
    },
    globalRankings: {
      youtube: topYoutube,
      seo: topSeo,
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
      worldwideClaimRequiresMeasuredCoverage: true,
    },
  };
}

function md(value) {
  return String(value ?? '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

function percent(value) {
  return `${(number(value) * 100).toFixed(1)}%`;
}

export function intelligenceMarkdown(report) {
  const topYoutube = report.globalRankings?.youtube || [];
  const topSeo = report.globalRankings?.seo || [];
  const lines = [
    `# Relatório global de inteligência editorial — ${report.runKey}`,
    '',
    '## Executive Summary',
    '',
    `- **A inteligência desta janela é acionável, não uma promessa de liderança automática.** Foram classificados ${topYoutube.length} sinais de vídeo e ${topSeo.length} oportunidades SEO para orientar pauta, atualização e links internos.`,
    `- **A cobertura é mundial por amostragem auditável.** O YouTube foi observado em ${report.metrics.youtubeMarketsCaptured} mercados e o Search Console registrou demanda em ${report.metrics.seoCountriesObserved} países; o relatório não chama essa amostra de ranking absoluto da internet.`,
    `- **O relatório entra no planejamento.** ${report.briefs.length} pautas foram derivadas dos sinais e ${report.refreshQueue.length} páginas entraram na fila de atualização.`,
    '',
    `Cadência: **${report.cadence}** · gerado em ${report.generatedAt}`,
    '',
    '## Os 10 sinais de YouTube com maior prioridade',
    '',
    '| # | Vídeo | Canal | Views | Views/dia | Mercados | Score | Aplicação editorial |',
    '|---:|---|---|---:|---:|---|---:|---|',
  ];
  if (topYoutube.length === 0) lines.push('| — | Nenhum sinal elegível | — | — | — | — | — | Execução sem cobertura suficiente |');
  for (const item of topYoutube) {
    lines.push(`| ${item.rank} | [${md(item.signalTitle)}](${item.sourceUrl}) | ${md(item.channelTitle || 'Não informado')} | ${item.views.toLocaleString('pt-BR')} | ${item.viewsPerDay.toLocaleString('pt-BR')} | ${md(item.capturedMarkets.join(', ') || 'não segmentado')} | ${item.score} | ${md(item.topic)} |`);
  }
  lines.push(
    '',
    '**Uso recomendado:** transformar os padrões recorrentes em explicações técnicas originais; vídeos e marcas de terceiros servem como inteligência, nunca como prova factual ou CTA.',
    '',
    '## As 10 oportunidades SEO mais fortes da demanda observada',
    '',
    '| # | Termo ou intenção | Fonte | Impressões | CTR | Posição | Variação | Países | Score | Próxima ação |',
    '|---:|---|---|---:|---:|---:|---:|---|---:|---|',
  );
  if (topSeo.length === 0) lines.push('| — | Nenhuma consulta acima do limiar | — | — | — | — | — | — | — | Ampliar janela ou aguardar demanda mensurável |');
  for (const item of topSeo) {
    const source = item.source === 'search-console' ? 'Google Search Console' : 'Proxy global do YouTube';
    const impressions = item.impressions == null ? '—' : Math.round(item.impressions).toLocaleString('pt-BR');
    const ctr = item.ctr == null ? '—' : percent(item.ctr);
    const position = item.position == null ? '—' : item.position.toFixed(1);
    const delta = item.delta == null ? '—' : percent(item.delta);
    const term = item.evidenceUrl ? `[${md(item.term)}](${item.evidenceUrl})` : md(item.term);
    lines.push(`| ${item.rank} | ${term} | ${source} | ${impressions} | ${ctr} | ${position} | ${delta} | ${md(item.countries.join(', ') || 'não segmentado')} | ${item.opportunityScore} | ${md(item.recommendedUse)} |`);
  }
  lines.push('', '## Pautas e atualizações que saem do ranking', '');
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
  lines.push(
    '',
    '## Próximas decisões automáticas',
    '',
    report.cadence === 'monthly'
      ? '- Renovar a janela editorial de 30 dias usando os rankings, as pautas derivadas e a fila de atualização.'
      : '- Atualizar a inteligência semanal e priorizar otimizações sem reprogramar sozinha a campanha mensal.',
    '- Aplicar termos somente quando responderem à intenção real da página; repetição artificial de palavras-chave fica proibida.',
    '- Reforçar links internos, títulos, descrições e cobertura semântica somente depois dos gates editoriais e técnicos.',
    '',
    '## Questões para a próxima janela',
    '',
    '- Quais temas aparecem em mais mercados e continuam crescendo na janela seguinte?',
    '- Quais consultas avançaram em impressões, mas perderam CTR ou ficaram entre as posições 4 e 20?',
    '- Quais pautas geradas realmente aumentaram tráfego qualificado, engajamento e descoberta do acervo?',
    '',
    '## Limitações e governança',
    '',
    '- “Global” significa amostra multirregional captada pelas APIs configuradas; não significa leitura integral de todas as buscas ou de todo o YouTube.',
    '- O Search Console mede a demanda que já encontrou o TheBiker, não o volume total de busca de toda a internet. Itens preenchidos pelo YouTube são proxies de intenção, não consultas nem volumes do Google. A API oficial do Google Trends permanece opcional enquanto estiver em acesso alfa.',
    '- Fontes, método, produto, imagem, preço e estoque precisam passar pelos gates do repositório.',
    '- Exceções ficam bloqueadas para revisão; conteúdo aprovado pelos gates pode ser agendado sem intervenção no Codex.',
    '- Marcas concorrentes podem servir apenas como sinal de mercado; não viram promoção nem CTA.',
    '',
    '<details><summary>Payload estruturado</summary>',
    '',
    '```json',
    JSON.stringify(report, null, 2),
    '```',
    '',
    '</details>',
  );
  return lines.join('\n');
}
