import assert from 'node:assert/strict';
import { buildEditorialIntelligence, intelligenceMarkdown } from './lib/editorial-intelligence.mjs';
import { periodsFor } from './run-editorial-intelligence.mjs';

const context = {
  runKey: 'weekly-2026-08-07',
  cadence: 'weekly',
  generatedAt: '2026-08-07T12:00:00.000Z',
  periods: {},
};
const config = {
  cyclingTerms: ['ciclismo', 'cycling', 'mtb', 'suspensão', 'addict'],
  blockedPromotionBrands: ['Trek'],
  portfolioBrands: ['Scott', 'Shimano'],
  minimumImpressions: 5,
  maximumBriefs: 8,
  refreshAfterDays: 90,
  youtubeMarkets: [
    { regionCode: 'BR', relevanceLanguage: 'pt' },
    { regionCode: 'US', relevanceLanguage: 'en' },
  ],
};
const report = buildEditorialIntelligence({
  context,
  config,
  gscCurrent: [
    { keys: ['ajuste suspensão mtb', 'https://example.com/ajuste/', 'bra'], clicks: 2, impressions: 120, ctr: 0.016, position: 8 },
    ...Array.from({ length: 11 }, (_, index) => ({ keys: [`consulta ciclismo ${index + 1}`, `https://example.com/seo-${index + 1}/`, index % 2 ? 'usa' : 'bra'], clicks: index + 1, impressions: 80 + index * 20, ctr: 0.03, position: 6 + index / 2 })),
  ],
  gscPrevious: [
    { keys: ['ajuste suspensão mtb', 'https://example.com/ajuste/', 'bra'], clicks: 1, impressions: 60, ctr: 0.016, position: 11 },
    ...Array.from({ length: 11 }, (_, index) => ({ keys: [`consulta ciclismo ${index + 1}`, `https://example.com/seo-${index + 1}/`, index % 2 ? 'usa' : 'bra'], clicks: index, impressions: 40 + index * 10, ctr: 0.02, position: 10 + index / 2 })),
  ],
  videos: [
    { id: 'safe', snippet: { title: 'Como ajustar suspensão MTB', description: 'ciclismo', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '90000', likeCount: '5000', commentCount: '300' }, _intelligence: { markets: ['BR', 'US'], languages: ['pt', 'en'] } },
    { id: 'blocked', snippet: { title: 'Trek lançamento de ciclismo', description: 'bike', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '1000000' }, _intelligence: { markets: ['US'], languages: ['en'] } },
    { id: 'motorized', snippet: { title: 'I built a mini SurRon MTB dirt bike', description: 'bike motocross', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '2000000' } },
    { id: 'commercial', snippet: { title: 'Best Electric Fat Bikes Available in India', description: 'ciclismo mountain bike', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '800000' }, _intelligence: { markets: ['IN', 'US'], languages: ['en'] } },
    ...Array.from({ length: 9 }, (_, index) => ({ id: `trend-${index}`, snippet: { title: `Mountain bike maintenance trend ${index}`, description: 'cycling MTB', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: String(700000 - index * 20000), likeCount: '4000', commentCount: '200' }, _intelligence: { markets: [index % 2 ? 'US' : 'BR'], languages: [index % 2 ? 'en' : 'pt'] } })),
  ],
  articles: [{ title: 'Ajuste de suspensão MTB', tags: ['suspensão'], url: 'https://example.com/ajuste/', dateModified: '2026-01-01T00:00:00Z' }],
});

assert.equal(report.governance.autoPublish, false);
assert.equal(report.governance.requiresHumanApproval, false);
assert.equal(report.governance.exceptionReviewRequired, true);
assert.equal(report.schemaVersion, 2);
assert.equal(report.globalRankings.youtube.length, 10);
assert.equal(report.globalRankings.seo.length, 10);
assert.deepEqual(report.globalRankings.youtube.map((item) => item.rank), Array.from({ length: 10 }, (_, index) => index + 1));
assert.deepEqual(report.globalRankings.seo.map((item) => item.rank), Array.from({ length: 10 }, (_, index) => index + 1));
assert.equal(report.scope.youtube.exactWorldwideTop10, false);
assert.equal(report.scope.seo.exactWorldwideSearchVolume, false);
assert.ok(report.metrics.youtubeMarketsCaptured >= 2);
assert.ok(report.metrics.seoCountriesObserved >= 2);
assert.ok(report.briefs.some((brief) => brief.action === 'refresh'));
assert.ok(report.briefs.every((brief) => !/^Trek lançamento/.test(brief.topic)));
assert.ok(report.marketSignals.every((signal) => signal.sourceUrl !== 'https://www.youtube.com/watch?v=motorized'));
const commercialSignal = report.marketSignals.find((signal) => signal.sourceUrl === 'https://www.youtube.com/watch?v=commercial');
assert.equal(commercialSignal.topic, 'Fat bikes: largura de pneus, pressão, tração e limites de uso');
assert.doesNotMatch(commercialSignal.topic, /available|best|india/i);
assert.ok(report.briefs.every((brief) => brief.audienceSegment === 'core_technical_cyclists'));
assert.ok(report.briefs.every((brief) => brief.experienceLevelTarget === 'intermediate_advanced'));
assert.equal(report.refreshQueue[0].url, 'https://example.com/ajuste/');
assert.match(intelligenceMarkdown(report), /Os 10 sinais de YouTube/);
assert.match(intelligenceMarkdown(report), /As 10 oportunidades SEO/);
assert.match(intelligenceMarkdown(report), /Limitações e governança/);
assert.deepEqual(periodsFor({ cadence: 'weekly', generatedAt: '2026-08-07T12:00:00.000Z' }), {
  lookbackDays: 7,
  dataDelayDays: 3,
  current: { startDate: '2026-07-29', endDate: '2026-08-04' },
  previous: { startDate: '2026-07-22', endDate: '2026-07-28' },
});

const fallbackTermsReport = buildEditorialIntelligence({
  context,
  config: {
    blockedPromotionBrands: [],
    portfolioBrands: ['Scott'],
    maximumBriefs: 8,
  },
  videos: [{
    id: 'fallback',
    snippet: {
      title: 'Ajuste de suspensão para mountain bike',
      description: 'Guia técnico para ciclistas',
      publishedAt: '2026-08-01T00:00:00Z',
    },
    statistics: { viewCount: '12000', likeCount: '500', commentCount: '30' },
  }],
});
assert.equal(fallbackTermsReport.metrics.youtubeVideos, 1);
assert.equal(fallbackTermsReport.briefs.length, 1);
assert.equal(fallbackTermsReport.globalRankings.seo.length, 1);
assert.equal(fallbackTermsReport.globalRankings.seo[0].source, 'youtube-global-derived');
assert.equal(fallbackTermsReport.governance.youtubeIsIntelligenceOnly, true);
console.log('Motor de inteligência editorial global validado com sucesso.');
