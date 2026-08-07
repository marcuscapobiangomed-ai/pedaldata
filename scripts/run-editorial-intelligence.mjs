#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEditorialIntelligence, intelligenceMarkdown } from './lib/editorial-intelligence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function argument(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(value, amount) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return isoDate(date);
}

export function periodsFor({ cadence, generatedAt }) {
  const lookbackDays = cadence === 'monthly' ? 28 : 7;
  const finalEnd = new Date(generatedAt);
  finalEnd.setUTCDate(finalEnd.getUTCDate() - 3);
  const currentEnd = isoDate(finalEnd);
  const currentStart = addUtcDays(currentEnd, -(lookbackDays - 1));
  const previousEnd = addUtcDays(currentStart, -1);
  const previousStart = addUtcDays(previousEnd, -(lookbackDays - 1));
  return {
    lookbackDays,
    dataDelayDays: 3,
    current: { startDate: currentStart, endDate: currentEnd },
    previous: { startDate: previousStart, endDate: previousEnd },
  };
}

async function responseJson(response, label) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(`${label}: HTTP ${response.status} - ${detail}`);
  }
  return response.json();
}

async function googleAccessToken(env) {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
  const missing = required.filter((name) => !env[name]);
  if (missing.length > 0) throw new Error(`Credenciais Google ausentes: ${missing.join(', ')}`);
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await responseJson(response, 'OAuth Google');
  if (!payload.access_token) throw new Error('OAuth Google não retornou access_token');
  return payload.access_token;
}

async function searchConsoleRows({ accessToken, siteUrl, period }) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: period.startDate,
      endDate: period.endDate,
      dimensions: ['query', 'page'],
      type: 'web',
      aggregationType: 'auto',
      rowLimit: 25000,
      dataState: 'final',
    }),
  });
  return (await responseJson(response, 'Search Console')).rows || [];
}

function youtubeAuthorization(env, accessToken) {
  if (env.YOUTUBE_API_KEY) return { key: env.YOUTUBE_API_KEY };
  return { accessToken };
}

async function youtubeGet(endpoint, parameters, authorization) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [name, value] of Object.entries(parameters)) url.searchParams.set(name, String(value));
  if (authorization.key) url.searchParams.set('key', authorization.key);
  const response = await fetch(url, {
    headers: authorization.accessToken ? { Authorization: `Bearer ${authorization.accessToken}` } : {},
  });
  return responseJson(response, `YouTube ${endpoint}`);
}

async function youtubeVideos({ env, accessToken, config, periods }) {
  const authorization = youtubeAuthorization(env, accessToken);
  const query = String(config.youtubeQuery || 'ciclismo mountain bike MTB').replaceAll('|', ' OR ');
  const search = await youtubeGet('search', {
    part: 'snippet',
    type: 'video',
    order: 'viewCount',
    maxResults: 50,
    regionCode: 'BR',
    relevanceLanguage: 'pt',
    publishedAfter: `${periods.current.startDate}T00:00:00Z`,
    q: query,
  }, authorization);
  const ids = [...new Set((search.items || []).map((item) => item.id?.videoId).filter(Boolean))];
  if (ids.length === 0) throw new Error('YouTube não retornou vídeos para a janela analisada');
  const details = await youtubeGet('videos', {
    part: 'snippet,statistics,contentDetails',
    id: ids.join(','),
    maxResults: 50,
  }, authorization);
  return details.items || [];
}

export async function runEditorialIntelligence({
  cadence = argument('cadence', 'weekly'),
  outputDirectory = argument('output', path.join(root, 'tmp/editorial-intelligence')),
  env = process.env,
  now = new Date(),
} = {}) {
  if (!['weekly', 'monthly'].includes(cadence)) throw new Error(`Cadência inválida: ${cadence}`);
  const config = JSON.parse(await fs.readFile(path.join(root, 'automation/n8n/config.example.json'), 'utf8'));
  const generatedAt = now.toISOString();
  const periods = periodsFor({ cadence, generatedAt });
  const context = {
    cadence,
    generatedAt,
    periods,
    runKey: `${cadence}-${isoDate(now)}`,
  };
  config.maximumBriefs = cadence === 'monthly' ? config.monthlyMaximumBriefs : config.weeklyMaximumBriefs;
  config.refreshAfterDays = cadence === 'monthly' ? config.monthlyRefreshAfterDays : 150;
  const accessToken = await googleAccessToken(env);
  const [gscCurrent, gscPrevious, videos, contentIndex] = await Promise.all([
    searchConsoleRows({ accessToken, siteUrl: env.SEARCH_CONSOLE_SITE_URL || config.searchConsoleSiteUrl, period: periods.current }),
    searchConsoleRows({ accessToken, siteUrl: env.SEARCH_CONSOLE_SITE_URL || config.searchConsoleSiteUrl, period: periods.previous }),
    youtubeVideos({ env, accessToken, config, periods }),
    fetch(env.CONTENT_INDEX_URL || config.contentIndexUrl).then((response) => responseJson(response, 'Índice público do blog')),
  ]);
  const report = buildEditorialIntelligence({
    context,
    config,
    gscCurrent,
    gscPrevious,
    videos,
    articles: contentIndex.articles || [],
  });
  if (report.briefs.length === 0) throw new Error('Inteligência sem pautas válidas; execução interrompida em modo fail-closed');
  await fs.mkdir(outputDirectory, { recursive: true });
  const jsonPath = path.join(outputDirectory, `${report.runKey}.json`);
  const markdownPath = path.join(outputDirectory, `${report.runKey}.md`);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(markdownPath, intelligenceMarkdown(report) + '\n');
  return { report, jsonPath, markdownPath };
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  runEditorialIntelligence()
    .then(({ report, jsonPath, markdownPath }) => console.log(JSON.stringify({ runKey: report.runKey, jsonPath, markdownPath })))
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
