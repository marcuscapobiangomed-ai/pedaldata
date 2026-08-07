import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { recoverBlockedCampaignFiles } from './automation/recover-blocked.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const result = await recoverBlockedCampaignFiles({ root })
console.log(JSON.stringify(result, null, 2))
