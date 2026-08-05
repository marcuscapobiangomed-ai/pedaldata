import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { CampaignSchema, selectPublicationCandidate, publicCampaignSummary } from './automation/campaign.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const campaignPath = path.join(root, 'bot/editorial-campaign.json')
const calendarPath = path.join(root, '_data/editorial-calendar.json')

function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export async function publishScheduled({ now = new Date(), dryRun = false } = {}) {
  const campaign = CampaignSchema.parse(JSON.parse(await fs.readFile(campaignPath, 'utf8')))
  const date = localDate(now)
  const item = selectPublicationCandidate(campaign, date)
  if (!item) return { status: 'idle', date, message: 'Nenhum post aprovado e agendado para hoje' }
  if (!item.postPath) throw new Error(`Pauta ${item.id} está agendada sem postPath`)
  const sourcePath = path.resolve(root, item.postPath)
  const draftsRoot = path.join(root, '_posts', 'drafts') + path.sep
  if (!sourcePath.startsWith(draftsRoot)) throw new Error(`postPath inseguro: ${item.postPath}`)
  let content = await fs.readFile(sourcePath, 'utf8')
  content = content.replace(/^published:\s*false\s*$/m, 'published: true')
  content = content.replace(/^editorial_status:\s*.*$/m, 'editorial_status: "published"')
  if (!/^published:\s*true\s*$/m.test(content)) throw new Error(`Post ${item.id} não possui published: false válido`)
  const targetPath = path.join(root, '_posts', path.basename(sourcePath))
  if (dryRun) return { status: 'ready', date, itemId: item.id, targetPath }
  await fs.writeFile(targetPath, content)
  await fs.unlink(sourcePath)
  item.status = 'published'
  item.publishedAt = now.toISOString()
  await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2) + '\n')
  await fs.writeFile(calendarPath, JSON.stringify(publicCampaignSummary(campaign), null, 2) + '\n')
  return { status: 'published', date, itemId: item.id, targetPath }
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  publishScheduled({ dryRun: process.env.AUTOMATION_DRY_RUN === 'true' }).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.stack || error.message); process.exitCode = 1 })
}
