import assert from 'node:assert/strict';
import { buildEditorialIntelligence, intelligenceMarkdown, queryCluster, searchIntent } from './lib/editorial-intelligence.mjs';
import { periodsFor } from './run-editorial-intelligence.mjs';

const context = {
  runKey: 'weekly-2026-08-08',
  cadence: 'weekly',
  generatedAt: '2026-08-08T12:00:00.000Z',
  periods: {},
};
const config = {
  searchConsoleCountry: 'bra',
  maximumSearchQueries: 1000,
  youtubeMaximumVideos: 20,
  cyclingTerms: ['ciclismo', 'bicicleta', 'mtb', 'suspensão', 'brasil'],
  blockedPromotionBrands: ['Trek'],
  portfolioBrands: ['Scott', 'Shimano'],
  minimumImpressions: 5,
  maximumBriefs: 8,
  refreshAfterDays: 90,
  youtubeSearches: Array.from({ length: 12 }, (_, index) => ({ id: `busca-${index + 1}`, regionCode: 'BR', relevanceLanguage: 'pt' })),
};

const brazilQueries = Array.from({ length: 1105 }, (_, index) => ({
  keys: [`como ajustar suspensão mtb brasil ${index + 1}`, `https://example.com/seo-${index + 1}/`, 'bra', index % 2 ? 'MOBILE' : 'DESKTOP'],
  clicks: index % 9,
  impressions: 20 + index,
  ctr: 0.03,
  position: 5 + (index % 15),
}));
const previousQueries = brazilQueries.map((row) => ({
  ...row,
  clicks: Math.max(0, row.clicks - 1),
  impressions: Math.max(5, Math.floor(row.impressions / 2)),
  position: row.position + 2,
}));
brazilQueries.push({ keys: ['consulta fora do brasil', 'https://example.com/fora/', 'usa', 'DESKTOP'], clicks: 100, impressions: 99999, ctr: 0.2, position: 1 });
brazilQueries.push({ keys: ['ajuste suspensão canibalizado', 'https://example.com/a/', 'bra', 'MOBILE'], clicks: 2, impressions: 200, ctr: 0.01, position: 8 });
brazilQueries.push({ keys: ['ajuste suspensão canibalizado', 'https://example.com/b/', 'bra', 'DESKTOP'], clicks: 1, impressions: 100, ctr: 0.01, position: 10 });

const videos = [
  ...Array.from({ length: 25 }, (_, index) => ({
    id: `br-${index + 1}`,
    snippet: { title: `Como ajustar bicicleta MTB Brasil ${index + 1}`, description: 'Ciclismo técnico brasileiro', publishedAt: '2026-08-01T00:00:00Z', channelTitle: `Canal técnico ${index + 1}` },
    statistics: { viewCount: String(900000 - index * 10000), likeCount: '5000', commentCount: '300' },
    contentDetails: { duration: index % 2 ? 'PT8M20S' : 'PT45S' },
    _intelligence: { markets: ['BR'], languages: ['pt'], searches: [`busca-${(index % 12) + 1}`, 'ciclismo-tecnico'] },
  })),
  { id: 'motorized', snippet: { title: 'SurRon MTB dirt bike Brasil', description: 'motocross', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '9000000' } },
  { id: 'celebrity', snippet: { title: 'Neymar no futebol e bicicleta Brasil', description: 'viral funny', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '8000000' } },
  { id: 'competitor', snippet: { title: 'Trek lançamento MTB Brasil', description: 'ciclismo', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '7000000' }, contentDetails: { duration: 'PT10M' }, _intelligence: { markets: ['BR'], languages: ['pt'], searches: ['mountain-bike'] } },
];

const report = buildEditorialIntelligence({
  context,
  config,
  gscCurrent: brazilQueries,
  gscPrevious: previousQueries,
  videos,
  articles: [{ title: 'Ajuste de suspensão MTB', tags: ['suspensão'], url: 'https://example.com/ajuste/', dateModified: '2026-01-01T00:00:00Z' }],
});

assert.equal(report.schemaVersion, 3);
assert.equal(report.scope.label.includes('Brasil'), true);
assert.equal(report.brazilRankings.youtubeDiscovery.length, 20);
assert.equal(report.brazilRankings.seoMeasured.length, 1000);
assert.ok(report.brazilRankings.seoMeasured.every((item) => item.source === 'search-console'));
assert.ok(report.brazilRankings.seoMeasured.every((item) => item.countries.every((country) => country === 'bra')));
assert.ok(report.brazilRankings.youtubeDiscovery.every((item) => !['motorized', 'celebrity'].some((id) => item.sourceUrl.endsWith(id))));
assert.ok(report.briefs.every((brief) => !/^Trek lançamento/.test(brief.topic)));
assert.equal(report.governance.youtubeDoesNotFillMeasuredSeo, true);
assert.equal(report.governance.brazilClaimRequiresCountryFilter, true);
assert.equal(report.metrics.youtubeSearchesConfigured, 12);
assert.ok(report.queryClusters.some((cluster) => cluster.cluster === 'suspensao'));
assert.equal(queryCluster('qual pressão do pneu tubeless'), 'pneus-tubeless');
assert.equal(searchIntent('onde comprar bicicleta gravel'), 'commercial');
assert.match(intelligenceMarkdown(report), /20 sinais de YouTube Brasil/);
assert.match(intelligenceMarkdown(report), /até \*\*1\.000 consultas\*\*/);
assert.match(intelligenceMarkdown(report), /Payload compacto para o planejador mensal/);
assert.ok(
  intelligenceMarkdown(report).length < 65_000,
  `GitHub issue body exceeded safe size: ${intelligenceMarkdown(report).length}`,
);

const emptySeo = buildEditorialIntelligence({ context, config, videos: videos.slice(0, 2) });
assert.equal(emptySeo.brazilRankings.seoMeasured.length, 0);
assert.equal(emptySeo.brazilRankings.youtubeDiscovery.length, 2);
assert.match(intelligenceMarkdown(emptySeo), /Dados SEO medidos ainda insuficientes/);

assert.deepEqual(periodsFor({ cadence: 'weekly', generatedAt: '2026-08-07T12:00:00.000Z' }), {
  lookbackDays: 7,
  dataDelayDays: 3,
  current: { startDate: '2026-07-29', endDate: '2026-08-04' },
  previous: { startDate: '2026-07-22', endDate: '2026-07-28' },
});

console.log('Motor de inteligência editorial Brasil validado com sucesso.');
