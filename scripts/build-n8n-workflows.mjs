import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDirectory = path.join(root, 'automation/n8n/workflows');
const check = process.argv.includes('--check');
const enginePath = path.join(root, 'scripts/lib/editorial-intelligence.mjs');
const engineSource = (await fs.readFile(enginePath, 'utf8')).replace(/\r\n/g, '\n').replaceAll('export function ', 'function ');

const ids = {
  weekly: '11000000-0000-4000-8000-000000000001', monthly: '11000000-0000-4000-8000-000000000002',
  weeklyMode: '11000000-0000-4000-8000-000000000003', monthlyMode: '11000000-0000-4000-8000-000000000004',
  context: '11000000-0000-4000-8000-000000000005', gscCurrent: '11000000-0000-4000-8000-000000000006',
  gscPrevious: '11000000-0000-4000-8000-000000000007', tagCurrent: '11000000-0000-4000-8000-000000000008',
  tagPrevious: '11000000-0000-4000-8000-000000000009', content: '11000000-0000-4000-8000-000000000010',
  tagContent: '11000000-0000-4000-8000-000000000011', youtubeSearch: '11000000-0000-4000-8000-000000000012',
  youtubeIds: '11000000-0000-4000-8000-000000000013', youtubeDetails: '11000000-0000-4000-8000-000000000014',
  tagYoutubeDetails: '11000000-0000-4000-8000-000000000015', youtubePopular: '11000000-0000-4000-8000-000000000016',
  tagYoutubePopular: '11000000-0000-4000-8000-000000000017', mergeYoutube: '11000000-0000-4000-8000-000000000018',
  normalizeYoutube: '11000000-0000-4000-8000-000000000019', mergeSeo: '11000000-0000-4000-8000-000000000020',
  mergeExternal: '11000000-0000-4000-8000-000000000021', mergeSignals: '11000000-0000-4000-8000-000000000022',
  mergeContext: '11000000-0000-4000-8000-000000000023', engine: '11000000-0000-4000-8000-000000000024',
  findIssue: '11000000-0000-4000-8000-000000000025', isNew: '11000000-0000-4000-8000-000000000026',
  createIssue: '11000000-0000-4000-8000-000000000027', commentIssue: '11000000-0000-4000-8000-000000000028',
  youtubeMarkets: '11000000-0000-4000-8000-000000000029',
};

function node(id, name, type, typeVersion, position, parameters = {}) {
  return { parameters, id, name, type, typeVersion, position };
}

function codeNode(id, name, position, jsCode) {
  return node(id, name, 'n8n-nodes-base.code', 2, position, { mode: 'runOnceForAllItems', jsCode });
}

function httpNode(id, name, position, parameters, credentialType) {
  const authentication = credentialType ? {
    authentication: 'predefinedCredentialType',
    nodeCredentialType: credentialType,
  } : {};
  return node(id, name, 'n8n-nodes-base.httpRequest', 4.2, position, {
    ...parameters,
    ...authentication,
    options: { timeout: 45000, response: { response: { neverError: false, responseFormat: 'json' } } },
  });
}

function connect(connections, from, to, output = 0, input = 0) {
  connections[from] ||= { main: [] };
  connections[from].main[output] ||= [];
  connections[from].main[output].push({ node: to, type: 'main', index: input });
}

const weeklyModeCode = `return [{ json: { cadence: 'weekly', lookbackDays: 7, generatedAt: new Date().toISOString() } }];`;
const monthlyModeCode = `return [{ json: { cadence: 'monthly', lookbackDays: 28, generatedAt: new Date().toISOString() } }];`;
const contextCode = `
const input = $input.first().json;
const end = new Date(input.generatedAt);
end.setUTCDate(end.getUTCDate() - 3);
const currentStart = new Date(end);
currentStart.setUTCDate(currentStart.getUTCDate() - input.lookbackDays + 1);
const previousEnd = new Date(currentStart);
previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
const previousStart = new Date(previousEnd);
previousStart.setUTCDate(previousStart.getUTCDate() - input.lookbackDays + 1);
const date = (value) => value.toISOString().slice(0, 10);
const runKey = input.cadence + '-' + date(new Date(input.generatedAt));
return [{ json: {
  ...input,
  runKey,
  periods: {
    current: { startDate: date(currentStart), endDate: date(end) },
    previous: { startDate: date(previousStart), endDate: date(previousEnd) },
  },
  config: {
    searchConsoleSiteUrl: 'https://marcuscapobiangomed-ai.github.io/thebikerblog/',
    contentIndexUrl: 'https://marcuscapobiangomed-ai.github.io/thebikerblog/api/content-index.json',
    githubOwner: 'marcuscapobiangomed-ai',
    githubRepository: 'thebikerblog',
    market: 'BR',
    searchConsoleCountry: 'bra',
    maximumSearchQueries: 1000,
    youtubeMaximumVideos: 20,
    youtubeSearches: [
      { id: 'ciclismo-tecnico', regionCode: 'BR', relevanceLanguage: 'pt', query: 'ciclismo técnico bicicleta' },
      { id: 'mountain-bike', regionCode: 'BR', relevanceLanguage: 'pt', query: 'mountain bike MTB Brasil' },
      { id: 'bike-estrada', regionCode: 'BR', relevanceLanguage: 'pt', query: 'bike de estrada ciclismo Brasil' },
      { id: 'gravel', regionCode: 'BR', relevanceLanguage: 'pt', query: 'bicicleta gravel Brasil' },
      { id: 'manutencao', regionCode: 'BR', relevanceLanguage: 'pt', query: 'manutenção bicicleta oficina' },
      { id: 'suspensao', regionCode: 'BR', relevanceLanguage: 'pt', query: 'suspensão bike ajuste MTB' },
      { id: 'componentes', regionCode: 'BR', relevanceLanguage: 'pt', query: 'componentes bicicleta Shimano SRAM' },
      { id: 'pneus-rodas', regionCode: 'BR', relevanceLanguage: 'pt', query: 'pneu roda bicicleta tubeless' },
      { id: 'bike-fit', regionCode: 'BR', relevanceLanguage: 'pt', query: 'bike fit posição ciclismo' },
      { id: 'treinamento', regionCode: 'BR', relevanceLanguage: 'pt', query: 'treino ciclismo performance' },
      { id: 'tecnologia', regionCode: 'BR', relevanceLanguage: 'pt', query: 'tecnologia bicicleta lançamento' },
      { id: 'thebiker-portfolio', regionCode: 'BR', relevanceLanguage: 'pt', query: 'Scott bike Shimano SRAM Syncros Brasil' },
    ],
    cyclingTerms: ['ciclismo', 'mountain bike', 'mtb', 'bike fit', 'suspensão', 'transmissão', 'shimano', 'sram', 'scott', 'syncros', 'pneu', 'roda'],
    portfolioBrands: ['Scott', 'Shimano', 'SRAM', 'Syncros', 'Fox', 'RockShox'],
    blockedPromotionBrands: ['Trek', 'Specialized', 'Cannondale', 'Cervélo', 'Giant', 'BMC', 'Pinarello'],
    minimumImpressions: 5,
    maximumBriefs: input.cadence === 'monthly' ? 30 : 8,
    refreshAfterDays: input.cadence === 'monthly' ? 90 : 150,
  },
} }];`;

const reportCode = `${engineSource}
const values = $input.all().map((item) => item.json);
const context = values.find((item) => item.kind === 'context');
const current = values.find((item) => item.kind === 'gsc_current')?.rows || [];
const previous = values.find((item) => item.kind === 'gsc_previous')?.rows || [];
const videos = values.find((item) => item.kind === 'youtube')?.videos || [];
const articles = values.find((item) => item.kind === 'content_index')?.articles || [];
if (!context) throw new Error('Contexto da execução ausente');
const report = buildEditorialIntelligence({ context, config: context.config, gscCurrent: current, gscPrevious: previous, videos, articles });
return [{ json: {
  ...report,
  title: '[INTEL-BR] ' + report.runKey + ' — Top 1.000 consultas e Top 20 YouTube Brasil',
  body: intelligenceMarkdown(report),
  issueQuery: 'repo:' + context.config.githubOwner + '/' + context.config.githubRepository + ' in:title "[INTEL] ' + report.runKey + '"',
  githubOwner: context.config.githubOwner,
  githubRepository: context.config.githubRepository,
} }];`;

const mainNodes = [
  node(ids.weekly, 'Agenda semanal', 'n8n-nodes-base.scheduleTrigger', 1.2, [-1080, -180], { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 6, triggerAtMinute: 10 }] } }),
  node(ids.monthly, 'Agenda mensal', 'n8n-nodes-base.scheduleTrigger', 1.2, [-1080, 20], { rule: { interval: [{ field: 'months', monthsInterval: 1, triggerAtDayOfMonth: 1, triggerAtHour: 7, triggerAtMinute: 10 }] } }),
  codeNode(ids.weeklyMode, 'Modo semanal', [-860, -180], weeklyModeCode),
  codeNode(ids.monthlyMode, 'Modo mensal', [-860, 20], monthlyModeCode),
  codeNode(ids.context, 'Contexto e configuração', [-620, -80], contextCode),
  httpNode(ids.gscCurrent, 'Search Console atual', [-360, -500], { method: 'POST', url: "={{ 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent($json.config.searchConsoleSiteUrl) + '/searchAnalytics/query' }}", sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: "={{ JSON.stringify({ startDate: $json.periods.current.startDate, endDate: $json.periods.current.endDate, dimensions: ['query','page','country','device'], dimensionFilterGroups: [{ filters: [{ dimension: 'country', operator: 'equals', expression: $json.config.searchConsoleCountry }] }], type: 'web', aggregationType: 'auto', rowLimit: $json.config.maximumSearchQueries, dataState: 'final' }) }}" }, 'googleOAuth2Api'),
  httpNode(ids.gscPrevious, 'Search Console anterior', [-360, -340], { method: 'POST', url: "={{ 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent($json.config.searchConsoleSiteUrl) + '/searchAnalytics/query' }}", sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: "={{ JSON.stringify({ startDate: $json.periods.previous.startDate, endDate: $json.periods.previous.endDate, dimensions: ['query','page','country','device'], dimensionFilterGroups: [{ filters: [{ dimension: 'country', operator: 'equals', expression: $json.config.searchConsoleCountry }] }], type: 'web', aggregationType: 'auto', rowLimit: $json.config.maximumSearchQueries, dataState: 'final' }) }}" }, 'googleOAuth2Api'),
  codeNode(ids.tagCurrent, 'Marcar Search Console atual', [-100, -500], "return [{ json: { kind: 'gsc_current', rows: $input.first().json.rows || [] } }];"),
  codeNode(ids.tagPrevious, 'Marcar Search Console anterior', [-100, -340], "return [{ json: { kind: 'gsc_previous', rows: $input.first().json.rows || [] } }];"),
  httpNode(ids.content, 'Índice público do blog', [-360, -150], { method: 'GET', url: '={{ $json.config.contentIndexUrl }}' }),
  codeNode(ids.tagContent, 'Marcar índice do blog', [-100, -150], "const data=$input.first().json; return [{ json: { kind: 'content_index', articles: data.articles || [] } }];"),
  codeNode(ids.youtubeMarkets, 'Expandir buscas do YouTube Brasil', [-380, 80], "const context=$input.first().json; return (context.config.youtubeSearches||[]).map((market)=>({json:{...context,market}}));"),
  httpNode(ids.youtubeSearch, 'YouTube busca por visualizações', [-140, 80], { method: 'GET', url: 'https://www.googleapis.com/youtube/v3/search', sendQuery: true, queryParameters: { parameters: [
    { name: 'part', value: 'snippet' }, { name: 'type', value: 'video' }, { name: 'order', value: 'viewCount' }, { name: 'maxResults', value: '50' },
    { name: 'regionCode', value: '={{ $json.market.regionCode }}' }, { name: 'relevanceLanguage', value: '={{ $json.market.relevanceLanguage }}' }, { name: 'videoCategoryId', value: '17' },
    { name: 'publishedAfter', value: "={{ $json.periods.current.startDate + 'T00:00:00Z' }}" }, { name: 'q', value: '={{ $json.market.query }}' },
  ] } }, 'googleOAuth2Api'),
  node(ids.youtubeIds, 'Consolidar IDs do YouTube', 'n8n-nodes-base.code', 2, [100, 80], { mode: 'runOnceForEachItem', jsCode: "const ids=($json.items||[]).map((item)=>item.id?.videoId).filter(Boolean); if(!ids.length) throw new Error('YouTube não retornou vídeos para a janela'); const market=$('Expandir buscas do YouTube Brasil').item.json.market; return {json:{ids:[...new Set(ids)].slice(0,50),market}};" }),
  httpNode(ids.youtubeDetails, 'YouTube métricas dos vídeos', [150, 80], { method: 'GET', url: 'https://www.googleapis.com/youtube/v3/videos', sendQuery: true, queryParameters: { parameters: [{ name: 'part', value: 'snippet,statistics,contentDetails' }, { name: 'id', value: '={{ $json.ids.join(",") }}' }] } }, 'googleOAuth2Api'),
  node(ids.tagYoutubeDetails, 'Marcar vídeos pesquisados', 'n8n-nodes-base.code', 2, [400, 80], { mode: 'runOnceForEachItem', jsCode: "const market=$('Consolidar IDs do YouTube').item.json.market; const videos=($json.items||[]).map((video)=>({...video,_intelligence:{markets:[market.regionCode],languages:[market.relevanceLanguage],searches:[market.id||market.query]}})); return {json:{kind:'youtube_part',videos}};" }),
  httpNode(ids.youtubePopular, 'YouTube populares em esportes', [-360, 260], { method: 'GET', url: 'https://www.googleapis.com/youtube/v3/videos', sendQuery: true, queryParameters: { parameters: [{ name: 'part', value: 'snippet,statistics,contentDetails' }, { name: 'chart', value: 'mostPopular' }, { name: 'regionCode', value: 'BR' }, { name: 'videoCategoryId', value: '17' }, { name: 'maxResults', value: '50' }] } }, 'googleOAuth2Api'),
  codeNode(ids.tagYoutubePopular, 'Marcar vídeos populares', [-100, 260], "const videos=($input.first().json.items||[]).map((video)=>({...video,_intelligence:{markets:['BR'],languages:['pt'],searches:['populares-esportes-br']}})); return [{json:{kind:'youtube_part',videos}}];"),
  node(ids.mergeYoutube, 'Unir sinais do YouTube', 'n8n-nodes-base.merge', 3.2, [640, 160], { mode: 'append' }),
  codeNode(ids.normalizeYoutube, 'Deduplicar YouTube', [860, 160], "const map=new Map(); for(const item of $input.all()) for(const video of item.json.videos||[]){const previous=map.get(video.id); if(!previous){map.set(video.id,video);continue;} previous._intelligence={markets:[...new Set([...(previous._intelligence?.markets||[]),...(video._intelligence?.markets||[])])],languages:[...new Set([...(previous._intelligence?.languages||[]),...(video._intelligence?.languages||[])])],searches:[...new Set([...(previous._intelligence?.searches||[]),...(video._intelligence?.searches||[])])]};} return [{json:{kind:'youtube',videos:[...map.values()]}}];"),
  node(ids.mergeSeo, 'Unir períodos SEO', 'n8n-nodes-base.merge', 3.2, [160, -420], { mode: 'append' }),
  node(ids.mergeExternal, 'Unir conteúdo e YouTube', 'n8n-nodes-base.merge', 3.2, [1080, -20], { mode: 'append' }),
  node(ids.mergeSignals, 'Unir todos os sinais', 'n8n-nodes-base.merge', 3.2, [1300, -260], { mode: 'append' }),
  node(ids.mergeContext, 'Anexar contexto', 'n8n-nodes-base.merge', 3.2, [1510, -160], { mode: 'append' }),
  codeNode(ids.engine, 'Gerar relatório e pautas', [1730, -160], reportCode),
  httpNode(ids.findIssue, 'Localizar relatório existente', [1960, -160], { method: 'GET', url: 'https://api.github.com/search/issues', sendQuery: true, queryParameters: { parameters: [{ name: 'q', value: '={{ $json.issueQuery }}' }] }, sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'X-GitHub-Api-Version', value: '2022-11-28' }] } }, 'githubApi'),
  node(ids.isNew, 'Relatório ainda não existe?', 'n8n-nodes-base.if', 2.2, [2190, -160], { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'is-new-report', leftValue: '={{ $json.total_count }}', rightValue: 0, operator: { type: 'number', operation: 'equals' } }], combinator: 'and' }, options: {} }),
  httpNode(ids.createIssue, 'Criar relatório no GitHub', [2430, -240], { method: 'POST', url: "={{ 'https://api.github.com/repos/' + $('Gerar relatório e pautas').item.json.githubOwner + '/' + $('Gerar relatório e pautas').item.json.githubRepository + '/issues' }}", sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'X-GitHub-Api-Version', value: '2022-11-28' }] }, sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: "={{ JSON.stringify({ title: $('Gerar relatório e pautas').item.json.title, body: $('Gerar relatório e pautas').item.json.body }) }}" }, 'githubApi'),
  httpNode(ids.commentIssue, 'Atualizar relatório existente', [2430, -80], { method: 'POST', url: "={{ 'https://api.github.com/repos/' + $('Gerar relatório e pautas').item.json.githubOwner + '/' + $('Gerar relatório e pautas').item.json.githubRepository + '/issues/' + $json.items[0].number + '/comments' }}", sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'X-GitHub-Api-Version', value: '2022-11-28' }] }, sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: "={{ JSON.stringify({ body: $('Gerar relatório e pautas').item.json.body }) }}" }, 'githubApi'),
];

const mainConnections = {};
connect(mainConnections, 'Agenda semanal', 'Modo semanal'); connect(mainConnections, 'Agenda mensal', 'Modo mensal');
connect(mainConnections, 'Modo semanal', 'Contexto e configuração'); connect(mainConnections, 'Modo mensal', 'Contexto e configuração');
for (const destination of ['Search Console atual', 'Search Console anterior', 'Índice público do blog', 'Expandir buscas do YouTube Brasil', 'YouTube populares em esportes']) connect(mainConnections, 'Contexto e configuração', destination);
connect(mainConnections, 'Search Console atual', 'Marcar Search Console atual'); connect(mainConnections, 'Search Console anterior', 'Marcar Search Console anterior');
connect(mainConnections, 'Marcar Search Console atual', 'Unir períodos SEO', 0, 0); connect(mainConnections, 'Marcar Search Console anterior', 'Unir períodos SEO', 0, 1);
connect(mainConnections, 'Índice público do blog', 'Marcar índice do blog');
connect(mainConnections, 'Expandir buscas do YouTube Brasil', 'YouTube busca por visualizações'); connect(mainConnections, 'YouTube busca por visualizações', 'Consolidar IDs do YouTube'); connect(mainConnections, 'Consolidar IDs do YouTube', 'YouTube métricas dos vídeos'); connect(mainConnections, 'YouTube métricas dos vídeos', 'Marcar vídeos pesquisados');
connect(mainConnections, 'YouTube populares em esportes', 'Marcar vídeos populares'); connect(mainConnections, 'Marcar vídeos pesquisados', 'Unir sinais do YouTube', 0, 0); connect(mainConnections, 'Marcar vídeos populares', 'Unir sinais do YouTube', 0, 1); connect(mainConnections, 'Unir sinais do YouTube', 'Deduplicar YouTube');
connect(mainConnections, 'Marcar índice do blog', 'Unir conteúdo e YouTube', 0, 0); connect(mainConnections, 'Deduplicar YouTube', 'Unir conteúdo e YouTube', 0, 1);
connect(mainConnections, 'Unir períodos SEO', 'Unir todos os sinais', 0, 0); connect(mainConnections, 'Unir conteúdo e YouTube', 'Unir todos os sinais', 0, 1);
connect(mainConnections, 'Unir todos os sinais', 'Anexar contexto', 0, 0); connect(mainConnections, 'Contexto e configuração', 'Anexar contexto', 0, 1); connect(mainConnections, 'Anexar contexto', 'Gerar relatório e pautas');
connect(mainConnections, 'Gerar relatório e pautas', 'Localizar relatório existente'); connect(mainConnections, 'Localizar relatório existente', 'Relatório ainda não existe?'); connect(mainConnections, 'Relatório ainda não existe?', 'Criar relatório no GitHub', 0); connect(mainConnections, 'Relatório ainda não existe?', 'Atualizar relatório existente', 1);

const mainWorkflow = {
  name: 'TheBiker — Inteligência SEO e YouTube',
  nodes: mainNodes,
  pinData: {},
  connections: mainConnections,
  active: false,
  settings: { executionOrder: 'v1', timezone: 'America/Sao_Paulo', saveManualExecutions: true, saveExecutionProgress: true },
  versionId: '21000000-0000-4000-8000-000000000001',
  meta: { templateCredsSetupCompleted: false },
  tags: [],
};

const errorNodes = [
  node('31000000-0000-4000-8000-000000000001', 'Erro do workflow', 'n8n-nodes-base.errorTrigger', 1, [-420, 0], {}),
  codeNode('31000000-0000-4000-8000-000000000002', 'Formatar incidente', [-160, 0], `const data=$input.first().json; const execution=data.execution||{}; const workflow=data.workflow||{}; const day=new Date().toISOString().slice(0,10); return [{json:{title:'[N8N] Falha de inteligência editorial '+day,body:'Falha no workflow **'+(workflow.name||'desconhecido')+'**.\\n\\n- Execução: '+(execution.url||execution.id||'não informada')+'\\n- Último nó: '+(execution.lastNodeExecuted||'não informado')+'\\n- Erro: '+(execution.error?.message||data.error?.message||'não informado')+'\\n\\nA execução fica bloqueada; nenhum conteúdo é publicado automaticamente.'}}];`),
  httpNode('31000000-0000-4000-8000-000000000003', 'Criar incidente no GitHub', [100, 0], { method: 'POST', url: 'https://api.github.com/repos/marcuscapobiangomed-ai/thebikerblog/issues', sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'X-GitHub-Api-Version', value: '2022-11-28' }] }, sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: '={{ JSON.stringify({ title: $json.title, body: $json.body }) }}' }, 'githubApi'),
];
const errorConnections = {}; connect(errorConnections, 'Erro do workflow', 'Formatar incidente'); connect(errorConnections, 'Formatar incidente', 'Criar incidente no GitHub');
const errorWorkflow = { name: 'TheBiker — Erros da inteligência editorial', nodes: errorNodes, pinData: {}, connections: errorConnections, active: false, settings: { executionOrder: 'v1', timezone: 'America/Sao_Paulo', saveManualExecutions: true }, versionId: '21000000-0000-4000-8000-000000000002', meta: { templateCredsSetupCompleted: false }, tags: [] };

const outputs = new Map([
  ['thebiker-seo-youtube-intelligence.json', JSON.stringify(mainWorkflow, null, 2) + '\n'],
  ['thebiker-intelligence-errors.json', JSON.stringify(errorWorkflow, null, 2) + '\n'],
]);
await fs.mkdir(targetDirectory, { recursive: true });
for (const [name, content] of outputs) {
  const target = path.join(targetDirectory, name);
  if (check) {
    const existing = await fs.readFile(target, 'utf8').catch(() => '');
    if (existing !== content) throw new Error(`Workflow n8n desatualizado: ${path.relative(root, target)}`);
  } else await fs.writeFile(target, content);
}
console.log(`${outputs.size} workflows n8n ${check ? 'verificados' : 'gerados'}.`);
