#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..')

const REQUIRED_FM = [
  'layout', 'title', 'date', 'tags', 'description',
  'content_type', 'review_method', 'tested_by_pedaldata', 'ai_assisted',
  'editorial_status',
]

const FORBIDDEN_PATTERNS = [
  { pattern: /\brevolucion[aá]ri[ao]\b/i, reason: 'linguagem publicitária' },
  { pattern: /\bperfeit[ao]\b/, reason: 'linguagem publicitária' },
  { pattern: /\bimbat[ií]vel\b/, reason: 'linguagem publicitária' },
  { pattern: /\ba melhor do mercado\b/i, reason: 'linguagem publicitária' },
  { pattern: /\btecnologia de ponta\b/i, reason: 'linguagem publicitária' },
  { pattern: /\bqualidade incompar[aá]vel\b/i, reason: 'linguagem publicitária' },
  { pattern: /\bcompra obrigat[oó]ria\b/i, reason: 'linguagem publicitária' },
  { pattern: /\bsem d[uú]vidas\b/i, reason: 'linguagem publicitária' },
  { pattern: /\bvale cada centavo\b/i, reason: 'linguagem publicitária' },
]

let totalErrors = 0
let totalWarnings = 0

function parseFrontmatter(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return null
  const fmText = fmMatch[1]
  const fm = {}
  for (const line of fmText.split('\n')) {
    const kvMatch = line.match(/^\s*([a-z_]+)\s*:\s*(.*)/)
    if (kvMatch) {
      fm[kvMatch[1]] = kvMatch[2].replace(/^["']|["']$/g, '').trim()
    }
  }
  return fm
}

const logError = (file, msg) => { console.log(`  ERRO ${file}: ${msg}`); totalErrors++ }
const logWarning = (file, msg) => { console.log(`  AVISO ${file}: ${msg}`); totalWarnings++ }

function validateFile(filePath, fileName) {
  const content = readFileSync(filePath, 'utf-8')
  const fm = parseFrontmatter(content)
  if (!fm) { logError(fileName, 'Sem frontmatter'); return }

  for (const field of REQUIRED_FM) {
    if (!fm[field] || fm[field] === '') logError(fileName, `'${field}' ausente`)
  }

  if (fm.editorial_status && !['draft', 'reviewed', 'published'].includes(fm.editorial_status)) {
    logError(fileName, `editorial_status inválido: "${fm.editorial_status}"`)
  }

  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
  for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
    const match = body.match(pattern)
    if (match) logWarning(fileName, `${reason}: "${match[0]}"`)
  }

  if (!body.match(/##\s*Fontes/i) && !body.match(/##\s*Refer[eê]ncias/i)) {
    logWarning(fileName, 'Seção de fontes não encontrada')
  }

  if (fm.content_type === 'review' && !body.match(/##\s*(Alternativas|Concorrentes)/i)) {
    logWarning(fileName, 'Review sem seção de alternativas')
  }
}

function main() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md') && f !== 'index.md').sort()
  console.log(`Validando ${files.length} posts...\n`)
  let validCount = 0

  for (const file of files) {
    if (file.startsWith('drafts')) continue
    const fullPath = join(POSTS_DIR, file)
    const fm = parseFrontmatter(readFileSync(fullPath, 'utf-8'))
    if (fm) validCount++
    validateFile(fullPath, file)
  }

  console.log(`\n${validCount}/${files.length} válidos  |  ERROS: ${totalErrors}  |  AVISOS: ${totalWarnings}`)
  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
