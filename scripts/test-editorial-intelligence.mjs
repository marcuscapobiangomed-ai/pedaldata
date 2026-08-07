import assert from 'node:assert/strict';
import { buildEditorialIntelligence, intelligenceMarkdown } from './lib/editorial-intelligence.mjs';

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
assert.ok(report.briefs.some((brief) => brief.action === 'refresh'));
assert.ok(report.briefs.every((brief) => !/^Trek lançamento/.test(brief.topic)));
assert.ok(report.briefs.every((brief) => brief.audienceSegment === 'core_technical_cyclists'));
assert.ok(report.briefs.every((brief) => brief.experienceLevelTarget === 'intermediate_advanced'));
assert.equal(report.refreshQueue[0].url, 'https://example.com/ajuste/');
assert.match(intelligenceMarkdown(report), /Gate editorial/);
console.log('Motor de inteligência editorial validado com sucesso.');
