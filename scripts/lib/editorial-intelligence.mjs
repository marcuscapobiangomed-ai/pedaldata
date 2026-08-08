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
const NON_TECHNICAL_VIDEO_NOISE = /\b(futebol|football|soccer|scaloni|messi|neymar|stunt|manobra viral|pegadinha|prank|funny|noob|legend|outfit|criança|crianca|kids?|child|dirtbike|motovlog)\b/;
const BRAZIL_RELEVANCE_TERMS = ['brasil', 'ciclismo', 'ciclista', 'bicicleta', 'mountain bike', 'mtb', 'gravel', 'speed', 'estrada', 'pedal', 'suspensao', 'shimano', 'sram', 'scott'];
const PORTUGUESE_CONTENT_TERMS = ['como', 'para', 'porque', 'qual', 'guia', 'teste', 'ajuste', 'manutencao', 'bicicleta', 'ciclismo', 'suspensao', 'pneu', 'freio', 'trilha', 'pedal', 'brasil', 'minha', 'depois', 'opiniao', 'primeiras', 'impressoes'];
const FOREIGN_TITLE_MARKERS = /\b(the|these|what|why|never|ride|illegal|going|kill|works|great|eigentlich|warum|deutsche|meisterschaft|entrena|demasiado|fuerte|mejora|soporte|reparar|bicicletas|neumatt)\b/;

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
  if (MOTORIZED_FALSE_POSITIVES.test(haystack) || NON_TECHNICAL_VIDEO_NOISE.test(haystack)) return false;
  const terms = Array.isArray(config.cyclingTerms) && config.cyclingTerms.length > 0
    ? config.cyclingTerms
    : DEFAULT_CYCLING_TERMS;
  const cyclingMatch = terms.some((term) => haystack.includes(normalizeText(term)));
  const brazilMatch = BRAZIL_RELEVANCE_TERMS.some((term) => haystack.includes(normalizeText(term)));
  const declaredLanguage = String(video.snippet?.defaultAudioLanguage || video.snippet?.defaultLanguage || '').toLowerCase();
  const title = normalizeText(video.snippet?.title || video.title);
  const portugueseMatches = PORTUGUESE_CONTENT_TERMS.filter((term) => title.includes(term)).length;
  const portugueseContent = declaredLanguage.startsWith('pt') || (portugueseMatches >= 2 && !FOREIGN_TITLE_MARKERS.test(title));
  return cyclingMatch && brazilMatch && (!config.requirePortugueseYouTube || portugueseContent);
}

function durationSeconds(value) {
  const match = String(value || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
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
  const capturedSearches = [...new Set(video._intelligence?.searches || [])].sort();
  const seconds = durationSeconds(video.contentDetails?.duration);
  const format = seconds !== null && seconds <= 60 ? 'short' : 'long-form';
  const technicalDepthBonus = format === 'long-form' ? 8 : 0;
  const recurrenceBonus = Math.min(18, capturedSearches.length * 3);
  return {
    source: 'youtube',
    topic: technicalTopicFromVideo(title),
    signalTitle: title,
    channelTitle: video.snippet?.channelTitle || null,
    publishedAt,
    sourceUrl: `https://www.youtube.com/watch?v=${video.id}`,
    score: Math.round(Math.log10(viewsPerDay + 1) * 24 + Math.min(20, ((likes + comments * 2) / Math.max(1, views)) * 1000) + recurrenceBonus + technicalDepthBonus),
    evidence: `${views.toLocaleString('pt-BR')} visualizações globais do vídeo; ${Math.round(viewsPerDay).toLocaleString('pt-BR')} por dia; encontrado em ${capturedSearches.length || 1} busca(s) configurada(s) para o Brasil`,
    views,
    likes,
    comments,
    viewsPerDay: Math.round(viewsPerDay),
    durationSeconds: seconds,
    format,
    capturedMarkets,
    capturedLanguages,
    capturedSearches,
    directPromotionAllowed: false,
    blockedBrandDetected: hasBlockedBrand(title, config),
  };
}

export function searchIntent(value) {
  const text = normalizeText(value);
  if (/\b(comprar|preco|precos|valor|onde comprar|loja|promocao)\b/.test(text)) return 'commercial';
  if (/\b(melhor|melhores|versus|\bvs\b|comparativo|diferenca)\b/.test(text)) return 'comparison';
  if (/\b(como|ajustar|regular|consertar|manutencao|limpar|trocar|resolver)\b/.test(text)) return 'how-to';
  if (/\b(review|analise|vale a pena|opinioes)\b/.test(text)) return 'evaluation';
  return 'informational';
}

export function queryCluster(value) {
  const text = normalizeText(value);
  const clusters = [
    ['suspensao', /suspens|amortec|\bsag\b|garfo/],
    ['pneus-tubeless', /pneu|tubeless|pressao|calibr/],
    ['transmissao', /cambio|transmiss|corrente|cassete|pedivela|grupo|di2/],
    ['freios', /freio|rotor|pastilha|sangria/],
    ['rodas', /roda|aro|cubo|rolamento/],
    ['bike-fit', /bike fit|posicao|selim|reach|stack|tamanho/],
    ['mountain-bike', /mountain bike|\bmtb\b|cross country|downhill|enduro/],
    ['bike-estrada', /speed|estrada|road bike|aero|endurance/],
    ['gravel', /gravel/],
    ['eletricas', /eletrica|e bike|ebike/],
    ['manutencao', /manutenc|limpeza|lubrifica|oficina|ajuste/],
    ['treinamento', /treino|potencia|cadencia|performance|ftp/],
    ['equipamentos', /capacete|pedal|sapatilha|roupa|acessorio|sensor/],
    ['compra-bicicleta', /comprar|preco|valor|melhor bike|bicicleta nova|bicicleta usada/],
    ['competicoes', /competicao|corrida|prova|worldtour|olimpi|campeonato/],
  ];
  return clusters.find(([, pattern]) => pattern.test(text))?.[0] || 'ciclismo-geral';
}

function gscOpportunity(row, previousMap) {
  const query = row.keys?.[0] || '';
  const page = row.keys?.[1] || '';
  const country = row.keys?.[2] || 'not-segmented';
  const device = row.keys?.[3] || 'not-segmented';
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
    device,
    cluster: queryCluster(query),
    intent: searchIntent(query),
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

function buildSeoRanking(searchSignals, limit = 1000) {
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
      devices: new Set(),
      targetUrls: new Set(),
      cluster: signal.cluster,
      intent: signal.intent,
      opportunityScore: 0,
    };
    group.clicks += signal.clicks;
    group.impressions += signal.impressions;
    group.priorImpressions += signal.priorImpressions;
    group.weightedPosition += signal.position * Math.max(1, signal.impressions);
    if (signal.country && signal.country !== 'not-segmented') group.countries.add(signal.country);
    if (signal.device && signal.device !== 'not-segmented') group.devices.add(signal.device);
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
      scope: 'demanda brasileira medida no Search Console do TheBiker',
      cluster: group.cluster,
      intent: group.intent,
      clicks: group.clicks,
      impressions: group.impressions,
      ctr,
      position,
      delta,
      countries,
      devices: [...group.devices].sort(),
      targetUrls: [...group.targetUrls].sort(),
      cannibalizationRisk: group.targetUrls.size > 1,
      opportunityScore: Math.round(group.opportunityScore + Math.min(10, countries.length * 2)),
      recommendedUse: position >= 4 && position <= 20 ? 'Otimizar conteúdo existente e reforçar links internos.' : 'Usar como termo principal ou secundário em pauta tecnicamente aderente.',
    };
  }).sort((left, right) => right.opportunityScore - left.opportunityScore || right.impressions - left.impressions);
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
  const brazilCountry = config.searchConsoleCountry || 'bra';
  const searchSignals = gscCurrent
    .filter((row) => !row.keys?.[2] || row.keys[2] === brazilCountry)
    .filter((row) => number(row.impressions) >= (config.minimumImpressions || 5))
    .map((row) => gscOpportunity(row, previousMap));
  const videoSignals = videos
    .filter((video) => isCyclingVideo(video, config))
    .map((video) => videoOpportunity(video, context, config))
    .sort((left, right) => right.score - left.score || right.viewsPerDay - left.viewsPerDay || right.views - left.views);
  const topYoutube = videoSignals.slice(0, config.youtubeMaximumVideos || 20).map((item, index) => ({ rank: index + 1, ...item }));
  const topSeo = buildSeoRanking(searchSignals, config.maximumSearchQueries || 1000);
  const seoCandidates = topSeo.slice(0, 100).map((item) => ({
    source: 'search-console', topic: item.term, targetUrl: item.targetUrls[0] || null, sourceUrl: item.targetUrls[0] || null,
    score: item.opportunityScore, evidence: `${item.impressions} impressões no Brasil; posição ${item.position.toFixed(1)}; CTR ${(item.ctr * 100).toFixed(1)}%`, directPromotionAllowed: true,
  }));
  const directCandidates = [...seoCandidates, ...videoSignals]
    .filter((item) => item.directPromotionAllowed || item.source === 'youtube')
    .filter((item) => !item.blockedBrandDetected)
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
  const requestedSearches = (config.youtubeSearches || []).map((search) => search.id || search.query);
  const capturedMarkets = [...new Set(videoSignals.flatMap((signal) => signal.capturedMarkets))].sort();
  const countriesObserved = [...new Set(searchSignals.map((signal) => signal.country).filter((country) => country && country !== 'not-segmented'))].sort();
  const clusters = [...topSeo.reduce((map, item) => {
    const current = map.get(item.cluster) || { cluster: item.cluster, queries: 0, clicks: 0, impressions: 0, pages: new Set(), cannibalizationRisks: 0 };
    current.queries += 1;
    current.clicks += item.clicks;
    current.impressions += item.impressions;
    item.targetUrls.forEach((url) => current.pages.add(url));
    if (item.cannibalizationRisk) current.cannibalizationRisks += 1;
    map.set(item.cluster, current);
    return map;
  }, new Map()).values()].map((item) => ({ ...item, pages: [...item.pages].sort() }))
    .sort((left, right) => right.impressions - left.impressions || right.queries - left.queries);
  return {
    schemaVersion: 3,
    runKey: context.runKey,
    cadence: context.cadence,
    generatedAt: context.generatedAt,
    periods: context.periods,
    scope: {
      label: 'inteligência editorial do nicho de ciclismo com foco exclusivo no Brasil',
      youtube: {
        method: 'amostra de descoberta da YouTube Data API obtida com região BR, idioma português e consultas técnicas brasileiras; as visualizações fornecidas são globais por vídeo',
        market: 'BR',
        searchesRequested: requestedSearches,
        marketsCaptured: capturedMarkets,
        exactBrazilViewsTop20: false,
      },
      seo: {
        method: 'até 1.000 consultas disponibilizadas pelo Google Search Console, filtradas para o país Brasil e agrupadas por termo, página e dispositivo; vídeos nunca preenchem lacunas de SEO medido',
        countriesObserved,
        maximumQueries: config.maximumSearchQueries || 1000,
        measuredOnly: true,
      },
    },
    metrics: {
      gscRows: gscCurrent.length,
      youtubeVideos: videos.length,
      publishedArticles: articles.length,
      briefs: briefs.length,
      refreshCandidates: refreshQueue.length,
      youtubeSearchesConfigured: requestedSearches.length,
      seoCountriesObserved: countriesObserved.length,
      seoMeasuredQueries: topSeo.length,
      seoClusters: clusters.length,
      cannibalizationRisks: topSeo.filter((item) => item.cannibalizationRisk).length,
    },
    brazilRankings: {
      youtubeDiscovery: topYoutube,
      seoMeasured: topSeo,
    },
    queryClusters: clusters,
    briefs,
    refreshQueue,
    discoverySignals: videoSignals.slice(0, 50),
    governance: {
      autoPublish: false,
      autoScheduleAfterGates: context.cadence === 'monthly',
      requiresHumanApproval: false,
      exceptionReviewRequired: true,
      competitorPromotionBlocked: true,
      staleCommercialDataFailClosed: true,
      youtubeIsIntelligenceOnly: true,
      youtubeDoesNotFillMeasuredSeo: true,
      brazilClaimRequiresCountryFilter: true,
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
  const topYoutube = report.brazilRankings?.youtubeDiscovery || [];
  const topSeo = report.brazilRankings?.seoMeasured || [];
  const planningPayload = {
    schemaVersion: report.schemaVersion,
    runKey: report.runKey,
    cadence: report.cadence,
    generatedAt: report.generatedAt,
    brazilRankings: {
      youtubeDiscovery: topYoutube.slice(0, 20),
      seoMeasured: topSeo.slice(0, 20),
    },
    queryClusters: report.queryClusters.map(({ pages, ...cluster }) => ({
      ...cluster,
      pageCount: pages.length,
      examplePages: pages.slice(0, 3),
    })),
    briefs: report.briefs,
    refreshQueue: report.refreshQueue,
    discoverySignals: [],
  };
  const lines = [
    `# Relatório Brasil de inteligência editorial — ${report.runKey}`,
    '',
    '## Executive Summary',
    '',
    `- **A inteligência desta janela é acionável, não uma promessa de liderança automática.** Foram classificados ${topYoutube.length} sinais de vídeo obtidos no YouTube Brasil e ${topSeo.length} consultas SEO brasileiras medidas para orientar pauta, atualização e links internos.`,
    `- **SEO medido e descoberta editorial permanecem separados.** Se o Search Console não entregar consultas, a seção SEO fica vazia; vídeos nunca são apresentados como palavras-chave do Google.`,
    `- **O relatório entra no planejamento.** ${report.briefs.length} pautas foram derivadas dos sinais e ${report.refreshQueue.length} páginas entraram na fila de atualização.`,
    '',
    `Cadência: **${report.cadence}** · gerado em ${report.generatedAt}`,
    '',
    '## Os 20 sinais de YouTube Brasil com maior prioridade',
    '',
    '| # | Vídeo | Canal | Views globais | Views/dia | Buscas BR | Formato | Score | Aplicação editorial |',
    '|---:|---|---|---:|---:|---:|---|---:|---|',
  ];
  if (topYoutube.length === 0) lines.push('| — | Nenhum sinal elegível | — | — | — | — | — | — | Execução sem cobertura suficiente |');
  for (const item of topYoutube) {
    lines.push(`| ${item.rank} | [${md(item.signalTitle)}](${item.sourceUrl}) | ${md(item.channelTitle || 'Não informado')} | ${item.views.toLocaleString('pt-BR')} | ${item.viewsPerDay.toLocaleString('pt-BR')} | ${item.capturedSearches.length || 1} | ${item.format} | ${item.score} | ${md(item.topic)} |`);
  }
  lines.push(
    '',
    '**Uso recomendado:** transformar os padrões recorrentes em explicações técnicas originais; vídeos e marcas de terceiros servem como inteligência, nunca como prova factual ou CTA.',
    '',
    '## Consultas SEO Brasil medidas no Search Console',
    '',
    `O payload e o CSV anexados contêm até **1.000 consultas**. Para manter esta issue legível, a tabela abaixo mostra as primeiras ${Math.min(50, topSeo.length)} por prioridade.`,
    '',
    '| # | Consulta | Cluster | Intenção | Impressões | CTR | Posição | Variação | Dispositivos | Páginas | Canibalização | Score | Próxima ação |',
    '|---:|---|---|---|---:|---:|---:|---:|---|---:|---|---:|---|',
  );
  if (topSeo.length === 0) lines.push('| — | Dados SEO medidos ainda insuficientes | — | — | — | — | — | — | — | — | — | — | Aguardar impressões reais; não preencher com proxies |');
  for (const item of topSeo.slice(0, 50)) {
    lines.push(`| ${item.rank} | ${md(item.term)} | ${item.cluster} | ${item.intent} | ${Math.round(item.impressions).toLocaleString('pt-BR')} | ${percent(item.ctr)} | ${item.position.toFixed(1)} | ${percent(item.delta)} | ${md(item.devices.join(', ') || 'não segmentado')} | ${item.targetUrls.length} | ${item.cannibalizationRisk ? 'sim' : 'não'} | ${item.opportunityScore} | ${md(item.recommendedUse)} |`);
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
    '- Quais clusters brasileiros continuam crescendo na janela seguinte?',
    '- Quais consultas avançaram em impressões, mas perderam CTR ou ficaram entre as posições 4 e 20?',
    '- Quais pautas geradas realmente aumentaram tráfego qualificado, engajamento e descoberta do acervo?',
    '',
    '## Limitações e governança',
    '',
    '- O Search Console mede somente a demanda que já encontrou o TheBiker e pode omitir consultas raras por privacidade; o CSV contém até 1.000 linhas disponibilizadas, não o universo integral das buscas brasileiras.',
    '- A região BR e as consultas em português tornam o YouTube um radar brasileiro, mas a API pública fornece visualizações globais de cada vídeo, não visualizações exclusivamente brasileiras.',
    '- YouTube é descoberta editorial e nunca preenche a seção SEO medida.',
    '- Fontes, método, produto, imagem, preço e estoque precisam passar pelos gates do repositório.',
    '- Exceções ficam bloqueadas para revisão; conteúdo aprovado pelos gates pode ser agendado sem intervenção no Codex.',
    '- Marcas concorrentes podem servir apenas como sinal de mercado; não viram promoção nem CTA.',
    '- O payload JSON completo e o CSV das consultas ficam anexados como artefatos da execução por 30 dias.',
    '',
    '<details><summary>Payload compacto para o planejador mensal</summary>',
    '',
    '```json',
    JSON.stringify(planningPayload, null, 2),
    '```',
    '',
    '</details>',
  );
  return lines.join('\n');
}
