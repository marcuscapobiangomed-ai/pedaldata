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
  cyclingTerms: ['ciclismo', 'mtb', 'suspensão', 'addict'],
  blockedPromotionBrands: ['Trek'],
  portfolioBrands: ['Scott', 'Shimano'],
  minimumImpressions: 5,
  maximumBriefs: 8,
  refreshAfterDays: 90,
};
const report = buildEditorialIntelligence({
  context,
  config,
  gscCurrent: [{ keys: ['ajuste suspensão mtb', 'https://example.com/ajuste/'], clicks: 2, impressions: 120, ctr: 0.016, position: 8 }],
  gscPrevious: [{ keys: ['ajuste suspensão mtb', 'https://example.com/ajuste/'], clicks: 1, impressions: 60, ctr: 0.016, position: 11 }],
  videos: [
    { id: 'safe', snippet: { title: 'Como ajustar suspensão MTB', description: 'ciclismo', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '90000', likeCount: '5000', commentCount: '300' } },
    { id: 'blocked', snippet: { title: 'Trek lançamento de ciclismo', description: 'bike', publishedAt: '2026-08-01T00:00:00Z' }, statistics: { viewCount: '1000000' } },
  ],
  articles: [{ title: 'Ajuste de suspensão MTB', tags: ['suspensão'], url: 'https://example.com/ajuste/', dateModified: '2026-01-01T00:00:00Z' }],
});

assert.equal(report.governance.autoPublish, false);
assert.equal(report.governance.requiresHumanApproval, false);
assert.equal(report.governance.exceptionReviewRequired, true);
assert.ok(report.briefs.some((brief) => brief.action === 'refresh'));
assert.ok(report.briefs.every((brief) => !/^Trek lançamento/.test(brief.topic)));
assert.ok(report.briefs.every((brief) => brief.audienceSegment === 'core_technical_cyclists'));
assert.ok(report.briefs.every((brief) => brief.experienceLevelTarget === 'intermediate_advanced'));
assert.equal(report.refreshQueue[0].url, 'https://example.com/ajuste/');
assert.match(intelligenceMarkdown(report), /Gate editorial/);
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
console.log('Motor de inteligência editorial validado com sucesso.');
