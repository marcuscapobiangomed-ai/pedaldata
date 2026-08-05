import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { AIProvider } from './gemini.js'
import { CampaignSchema, publicCampaignSummary, selectProductionCandidate } from './automation/campaign.js'
import { GroundedResearcher } from './automation/grounded-research.js'

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function knowledgeEvidence(root, item) {
  const directory = path.join(root, '_data/product-knowledge/bikes')
  const files = await fs.readdir(directory)
  const records = await Promise.all(files.filter((name) => name.endsWith('.json')).map(async (name) => JSON.parse(await fs.readFile(path.join(directory, name), 'utf8'))))
  const words = `${item.title} ${item.summary}`.toLocaleLowerCase('pt-BR')
  const selected = records.filter((record) => item.productIds.includes(record.id) || words.includes(record.model.toLocaleLowerCase('pt-BR')) || words.includes(record.model.split(' ')[0].toLocaleLowerCase('pt-BR')))
  const fallback = selected.length > 0 ? selected : records
  return fallback.map((record) => ({ id: record.id, brand: record.brand, model: record.model, modelYear: record.modelYear, facts: record.facts, sources: record.sources })).slice(0, 6)
}

async function persist(root, campaign) {
  await fs.writeFile(path.join(root, 'bot/editorial-campaign.json'), JSON.stringify(campaign, null, 2) + '\n')
  await fs.writeFile(path.join(root, '_data/editorial-calendar.json'), JSON.stringify(publicCampaignSummary(campaign), null, 2) + '\n')
}

export async function runCampaignProducer({ root = defaultRoot, env = process.env, researcher = new GroundedResearcher(env), ai = new AIProvider(), now = new Date() } = {}) {
  const campaignPath = path.join(root, 'bot/editorial-campaign.json')
  const campaign = CampaignSchema.parse(JSON.parse(await fs.readFile(campaignPath, 'utf8')))
  const item = selectProductionCandidate(campaign)
  if (!item) return { status: 'idle', message: 'Nenhuma pauta planejada aguardando produção' }
  if (env.AUTOMATION_DRY_RUN === 'true') return { status: 'ready', itemId: item.id }
  const today = now.toISOString().slice(0, 10)
  try {
    item.attempts = (item.attempts || 0) + 1
    item.lastAttemptAt = now.toISOString()
    item.status = 'researching'
    await persist(root, campaign)
    const evidence = await knowledgeEvidence(root, item)
    const research = await researcher.research({ item, internalEvidence: evidence, today })
    const researchDir = path.join(root, 'content/research/campaign')
    await fs.mkdir(researchDir, { recursive: true })
    await fs.writeFile(path.join(researchDir, `${item.id}.json`), JSON.stringify(research, null, 2) + '\n')
    item.status = 'research-ready'
    await persist(root, campaign)
    item.status = 'drafting'
    await persist(root, campaign)
    const post = await ai.processCase(item.title, research)
    if (post.pipelineMetadata?.premiumEditPending) throw new Error('Revisão premium necessária, mas DeepSeek não está disponível')
    const draftDir = path.join(root, '_posts/drafts')
    await fs.mkdir(draftDir, { recursive: true })
    const postPath = `_posts/drafts/${item.publishDate}-${item.id}.md`
    await fs.writeFile(path.join(root, postPath), post.content)
    item.postPath = postPath
    item.status = 'validation'
    item.aiReview = {
      score: post.pipelineMetadata?.scoreBeforePremium ?? null,
      finalScore: post.pipelineMetadata?.finalScore ?? null,
      finalBlockers: post.pipelineMetadata?.finalBlockers ?? 0,
      premiumEditUsed: post.pipelineMetadata?.premiumEditUsed === true,
      providers: post.pipelineMetadata?.providers || {},
      generatedAt: now.toISOString(),
    }
    await persist(root, campaign)
    return { status: 'validation', itemId: item.id, postPath, researchPath: `content/research/campaign/${item.id}.json` }
  } catch (error) {
    item.status = 'blocked'
    item.blockReason = String(error.message || error).slice(0, 700)
    await persist(root, campaign)
    throw error
  }
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  runCampaignProducer().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.stack || error.message); process.exitCode = 1 })
}
