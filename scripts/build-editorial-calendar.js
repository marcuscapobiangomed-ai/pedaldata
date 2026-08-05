import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { CampaignSchema, publicCampaignSummary } from '../bot/src/automation/campaign.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const campaignPath = path.join(root, 'bot/editorial-campaign.json')
const target = path.join(root, '_data/editorial-calendar.json')
const campaign = CampaignSchema.parse(JSON.parse(fs.readFileSync(campaignPath, 'utf8')))
const output = JSON.stringify(publicCampaignSummary(campaign), null, 2) + '\n'
if (check) {
  const normalizeLines = (value) => value.replace(/\r\n/g, '\n')
  if (!fs.existsSync(target) || normalizeLines(fs.readFileSync(target, 'utf8')) !== normalizeLines(output)) process.exit(1)
} else fs.writeFileSync(target, output)
console.log(`${campaign.items.length} títulos programados para 12h em ${campaign.timezone}.`)
