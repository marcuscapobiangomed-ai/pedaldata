import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AIProvider } from './gemini.js'
import { parseIntelligenceMarkdown, renewCampaignFiles } from './automation/monthly-campaign.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function issueBody() {
  const reportFlag = process.argv.indexOf('--report')
  if (reportFlag >= 0 && process.argv[reportFlag + 1]) return fs.readFile(path.resolve(process.argv[reportFlag + 1]), 'utf8')
  if (!process.env.GITHUB_EVENT_PATH) throw new Error('Use --report <arquivo.md> ou execute a partir de um evento issues do GitHub')
  const event = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8'))
  if (!String(event.issue?.title || '').startsWith('[INTEL] monthly-')) throw new Error('Evento não contém uma issue mensal de inteligência')
  return event.issue?.body || ''
}

const report = parseIntelligenceMarkdown(await issueBody())
const result = await renewCampaignFiles({ root, report, ai: new AIProvider(), dryRun: process.argv.includes('--dry-run') })
console.log(JSON.stringify(result, null, 2))
