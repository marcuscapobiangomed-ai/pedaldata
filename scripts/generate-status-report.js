#!/usr/bin/env node
// Gera relatório de status do projeto para o board operacional
// Uso: node scripts/generate-status-report.js

import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const WEEK = 1000 * 60 * 60 * 24 * 7

function countFiles(dir, ext) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter(f => f.endsWith(ext)).length
}

function countField(dir, field) {
  if (!existsSync(dir)) return 0
  let count = 0
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
      if (data[field] && data[field] !== '' && data[field] !== 0) count++
    } catch {}
  }
  return count
}

function checkPrices(dir) {
  if (!existsSync(dir)) return { total: 0, withUrls: 0, recent: 0 }
  let total = 0, withUrls = 0, recent = 0
  const now = new Date()
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      total++
      const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
      for (const obs of (data.observations || [])) {
        if (obs.url) withUrls++
        if (obs.checkedAt) {
          const days = (now - new Date(obs.checkedAt)) / (1000 * 60 * 60 * 24)
          if (days <= 30) recent++
        }
      }
    } catch {}
  }
  return { total, withUrls, recent }
}

function calculateProgress() {
  const report = {
    generatedAt: new Date().toISOString().split('T')[0],
    weeks: {
      '01-02': { label: 'Segurança e Pipeline', progress: 0, totalTasks: 9, doneTasks: 0 },
      '03-04': { label: 'Auditoria de Conteúdo', progress: 0, totalTasks: 3, doneTasks: 0 },
      '05-06': { label: 'Base de Produtos', progress: 0, totalTasks: 1, doneTasks: 0 },
      '07-08': { label: 'Páginas de Produto', progress: 0, totalTasks: 1, doneTasks: 0 },
      '09-10': { label: 'Comparador', progress: 0, totalTasks: 1, doneTasks: 0 },
      '11-12': { label: 'Analytics e Monetização', progress: 0, totalTasks: 2, doneTasks: 0 },
    },
    metrics: {
      bikes: 0,
      bikesWithSource: 0,
      pricesWithUrl: 0,
      pricesRecent: 0,
      postsTotal: 0,
      postsAudited: 0,
      sourcesTotal: 0,
      sourcesWithUrl: 0,
      pagesGenerated: 0,
    },
    blockers: [],
    status: 'in_progress',
  }

  // Products
  const bikesDir = join(ROOT, 'data', 'products', 'bikes')
  report.metrics.bikes = countFiles(bikesDir, '.json')
  report.metrics.bikesWithSource = countField(bikesDir, 'officialUrl')

  // Prices
  const prices = checkPrices(join(ROOT, 'data', 'prices'))
  report.metrics.pricesWithUrl = prices.withUrls
  report.metrics.pricesRecent = prices.recent

  // Posts
  const postsDir = join(ROOT, '_posts')
  const posts = readdirSync(postsDir).filter(f => f.endsWith('.md') && f !== 'index.md' && !f.startsWith('drafts'))
  const archived = readdirSync(join(postsDir, 'archived')).filter(f => f.endsWith('.md'))
  report.metrics.postsTotal = posts.length + archived.length
  report.metrics.postsAudited = archived.length

  // Sources
  const sourcesFile = join(ROOT, 'data', 'sources', 'sources.json')
  if (existsSync(sourcesFile)) {
    const sources = JSON.parse(readFileSync(sourcesFile, 'utf-8'))
    report.metrics.sourcesTotal = sources.sources.length
    report.metrics.sourcesWithUrl = sources.sources.filter(s => s.url).length
  }

  // Pages
  report.metrics.pagesGenerated = countFiles(join(ROOT, 'bikes'), '.html')

  // Progress calculation for weeks 1-2 based on actual artifacts
  const hasPRWorkflow = existsSync(join(ROOT, '.github', 'workflows', 'pr-validate.yml'))
  const hasInputValidation = existsSync(join(ROOT, 'bot', 'src', 'input-validator.js'))
  const hasSecurityDoc = existsSync(join(ROOT, 'SECURITY.md'))
  const hasBranchDoc = existsSync(join(ROOT, 'docs', 'operations', 'branch-protection.md'))
  
  report.weeks['01-02'].doneTasks = [
    hasPRWorkflow, hasInputValidation, hasSecurityDoc, hasBranchDoc,
    report.metrics.postsAudited > 0,
    report.metrics.bikes > 0,
    report.metrics.sourcesTotal > 0,
  ].filter(Boolean).length
  report.weeks['01-02'].progress = Math.round((report.weeks['01-02'].doneTasks / report.weeks['01-02'].totalTasks) * 100)

  // Progress for weeks 3-4
  report.weeks['03-04'].doneTasks = [
    report.metrics.postsAudited > 10,
    !readdirSync(join(ROOT, 'audit')).some(f => f.includes('high-risk') && !existsSync(join(ROOT, 'audit', f))),
    report.metrics.sourcesTotal > 0,
  ].filter(Boolean).length
  report.weeks['03-04'].progress = Math.round((report.weeks['03-04'].doneTasks / report.weeks['03-04'].totalTasks) * 100)

  // Progress for weeks 5-6
  report.weeks['05-06'].doneTasks = report.metrics.bikes >= 10 ? 1 : 0
  report.weeks['05-06'].progress = Math.round((report.weeks['05-06'].doneTasks / report.weeks['05-06'].totalTasks) * 100)

  // Progress for weeks 7-8
  report.weeks['07-08'].doneTasks = report.metrics.pagesGenerated >= 10 ? 1 : 0
  report.weeks['07-08'].progress = Math.round((report.weeks['07-08'].doneTasks / report.weeks['07-08'].totalTasks) * 100)

  // Check for blockers
  if (readdirSync(postsDir).some(f => f.includes('Sergio'))) {
    report.blockers.push('Ainda há referências a autor fictício Sergio Arantes')
  }
  if (report.metrics.bikes > 0 && report.metrics.bikesWithSource === 0) {
    report.blockers.push('Bicicletas sem fontes oficiais vinculadas')
  }
  if (report.metrics.postsTotal > 0 && report.metrics.postsAudited === 0) {
    report.blockers.push('Nenhum post auditado')
  }

  // Overall progress
  const totalDone = Object.values(report.weeks).reduce((a, w) => a + w.doneTasks, 0)
  const totalAll = Object.values(report.weeks).reduce((a, w) => a + w.totalTasks, 0)
  report.overallProgress = Math.round((totalDone / totalAll) * 100)

  return report
}

const report = calculateProgress()
const outputPath = join(ROOT, 'project', '90-days', 'status-report.json')

import { writeFileSync } from 'fs'
writeFileSync(outputPath, JSON.stringify(report, null, 2))

// Also generate markdown summary
const md = `# Status Report — Pedal Data 90 Dias

**Gerado em:** ${report.generatedAt}
**Progresso geral:** ${report.overallProgress}%

## Progresso por semana

| Semana | Tarefa | Progresso |
|--------|--------|-----------|
${Object.entries(report.weeks).map(([k, w]) => `| Semanas ${k} | ${w.label} | ${w.doneTasks}/${w.totalTasks} (${w.progress}%) |`).join('\n')}

## Métricas

| Métrica | Valor |
|---------|-------|
| Bicicletas cadastradas | ${report.metrics.bikes} |
| Com fonte oficial | ${report.metrics.bikesWithSource} |
| Registros de preço com URL | ${report.metrics.pricesWithUrl} |
| Preços atualizados (<30d) | ${report.metrics.pricesRecent} |
| Total de posts | ${report.metrics.postsTotal} |
| Posts arquivados/auditados | ${report.metrics.postsAudited} |
| Fontes cadastradas | ${report.metrics.sourcesTotal} |
| Fontes com URL | ${report.metrics.sourcesWithUrl} |
| Páginas de produto geradas | ${report.metrics.pagesGenerated} |

## Bloqueadores

${report.blockers.length > 0 ? report.blockers.map(b => `- ${b}`).join('\n') : 'Nenhum bloqueador detectado.'}

## Status

${report.overallProgress >= 80 ? '🟢 No caminho certo' : report.overallProgress >= 40 ? '🟡 Em andamento' : '🔧 Infraestrutura inicial'}
`

writeFileSync(join(ROOT, 'project', '90-days', 'status-report.md'), md)
console.log(`Status report gerado: ${outputPath}`)
console.log(`Progresso geral: ${report.overallProgress}%`)
