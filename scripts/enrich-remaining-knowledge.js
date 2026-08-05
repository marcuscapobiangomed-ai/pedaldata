import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateProductKnowledgeRecord } from '../bot/src/schemas/product-knowledge.schema.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const directory = path.join(root, '_data/product-knowledge/bikes')
const check = process.argv.includes('--check')
const observedAt = '2026-08-04'
const c = (value, unit = null, qualifier = null) => [value, unit, 'confirmed', qualifier]
const a = (value, unit, qualifier) => [value, unit, 'approximate', qualifier]

const records = {
  'bicicleta-scott-scale-940-black': { source: 'manufacturer', facts: {
    'identity.manufacturerModelCode': c('425466'), 'identity.color': c('black'), 'identity.sizes': c(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    'frame.material': c('Scale Alloy 6061 Custom Butted Tubing'), 'frame.rearAxle': c('5x141', 'mm'),
    'suspension.fork': c('RockShox Judy Silver TK Coil'), 'suspension.frontTravel': c(100, 'mm'),
    'drivetrain.rearDerailleur': c('Shimano Deore RD-M6100 SGS'), 'drivetrain.speeds': c(12, 'velocidades'),
    'drivetrain.crankset': c('Shimano FC-MT512-1, 32T'), 'drivetrain.cassette': c('Shimano Deore CS-M6100-12, 10-51T'),
    'brakes.calipers': c('Shimano MT200 Disc Brake'), 'brakes.rotors': c('Shimano SM-RT10 CL 180 mm dianteiro / 160 mm traseiro'),
    'wheels.rims': c('Alex X-25, 25 mm, tubeless ready'), 'tires': c('Maxxis Rekon Race 29x2.4, EXO, tubeless ready'),
    'weight.approximate': a(13.9, 'kg', 'Configuração tubeless sem pedais declarada pelo fabricante'), 'limits.maxSystemWeight': c(130, 'kg')
  }},
  'quadro-scott-scale-rc-team-hmf-2026': { source: 'manufacturer', facts: {
    'identity.manufacturerModelCode': c('292046'), 'identity.sizes': c(['S', 'M', 'L', 'XL']), 'frame.material': c('Scale Carbon HMF'),
    'frame.headAngleAdjustment': c(true), 'frame.cableIntegration': c('Syncros Cable Integration System'),
    'frame.bottomBracket': c('BB92'), 'frame.derailleurHanger': c('UDH'), 'frame.rearAxle': c('12x148', 'mm'),
    'frame.chainline': c(55, 'mm'), 'included.headset': c('Syncros - Acros Pro Headset System')
  }},
  'bicicleta-scott-addict-rc-20-di2-2026-pre-venda-vzvx9': { source: 'manufacturer', facts: {
    'identity.manufacturerModelCode': c('425685'), 'identity.color': c('reseda green'), 'identity.sizes': c(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']),
    'frame.material': c('Addict RC HMX Carbon'), 'fork.model': c('Addict RC HMX Flatmount Disc'),
    'drivetrain.groupset': c('Shimano Ultegra Di2'), 'drivetrain.speeds': c(24, 'velocidades totais'), 'drivetrain.shifting': c('electronic'),
    'drivetrain.rearDerailleur': c('Shimano Ultegra Di2 RD-R8150'), 'drivetrain.crankset': c('Shimano Ultegra FC-R8100 52-36T'),
    'drivetrain.cassette': c('Shimano Ultegra CS-R8100-12, 11-34'), 'brakes.calipers': c('Shimano BR-R8170 Hydraulic Disc'),
    'brakes.rotors': c('Shimano RT-CL800 160 mm dianteiro / 140 mm traseiro'), 'wheels.wheelset': c('Syncros Capital 1.0 40 Disc'),
    'tires': c('Continental Grand Prix TR 30x622'), 'weight.approximate': a(7.3, 'kg', 'Peso aproximado declarado pelo fabricante'),
    'limits.maxSystemWeight': c(120, 'kg'), 'limits.maximumTireWidth': c(34, 'mm')
  }},
  'bicicleta-scott-addict-rc-pro-di2-2026-pre-venda': { source: 'manufacturer', facts: {
    'identity.manufacturerModelCode': c('425683'), 'identity.color': c('cumulus white/carbon black'), 'identity.sizes': c(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']),
    'frame.material': c('Addict RC HMX Carbon'), 'fork.model': c('Addict RC HMX Flatmount Disc'),
    'drivetrain.groupset': c('Shimano Dura-Ace Di2'), 'drivetrain.speeds': c(24, 'velocidades totais'), 'drivetrain.shifting': c('electronic'),
    'drivetrain.rearDerailleur': c('Shimano Dura-Ace RD-R9250'), 'drivetrain.crankset': c('Shimano Dura-Ace FC-R9200 52x36'),
    'drivetrain.cassette': c('Shimano Dura-Ace CS-R9200-12, 11-34'), 'brakes.calipers': c('Shimano BR-R9270 Hydraulic Disc'),
    'brakes.rotors': c('Shimano RT-CL900 160 mm dianteiro / 140 mm traseiro'), 'wheels.wheelset': c('Syncros Capital 1.0S 40 mm'),
    'tires': c('Schwalbe PRO ONE 700x30C TL-Easy'), 'weight.approximate': a(6.7, 'kg', 'Peso aproximado declarado pelo fabricante'),
    'limits.maxSystemWeight': c(120, 'kg')
  }},
  'bicicleta-scott-addict-50-2026-pre-venda-1bxzy': { source: 'manufacturer', storeFacts: { 'identity.color': c('Carbon Grey'), 'commercial.sizesListed': c([47, 49, 52, 54, 56, 58]) }, facts: {
    'identity.manufacturerModelCode': c('425358'), 'frame.material': c('Addict HMF Carbon'), 'frame.derailleurHanger': c('UDH'),
    'fork.model': c('Addict HMF Flatmount Disc'), 'geometry.intent': c('endurance'), 'drivetrain.groupset': c('Shimano 105'),
    'drivetrain.rearSpeeds': c(12, 'velocidades'), 'drivetrain.crankset': c('Shimano 105 FC-R7100 50-34T'),
    'drivetrain.cassette': c('Shimano CS-R7100 11-34'), 'brakes.model': c('Shimano BR-R7170'),
    'wheels.model': c('Syncros RP2.0 Disc'), 'tires.model': c('Schwalbe ONE 700x34C'), 'limits.maximumTireWidth': c(38, 'mm'),
    'weight.approximate': a(8.9, 'kg', 'Peso aproximado declarado pelo fabricante'), 'limits.maxSystemWeight': c(120, 'kg')
  }},
  'bicicleta-scott-scale-980-black': { source: 'store', facts: {
    'identity.color': c('Black'), 'identity.sizes': c(['S', 'M', 'L', 'XL']), 'frame.material': c('Scale Alloy 6061 Custom Butted Tubing'),
    'suspension.fork': c('Suntour X1 32 RL-R'), 'suspension.frontTravel': c(100, 'mm'),
    'drivetrain.rearDerailleur': c('Shimano Deore RD-M6100'), 'drivetrain.speeds': c(12, 'velocidades'),
    'drivetrain.crankset': c('Shimano FC-MT512-1'), 'brakes.calipers': c('Shimano MT200'),
    'tires': c('Maxxis Rekon Race 29x2.4'), 'weight.approximate': a(14.3, 'kg', 'Configuração tubeless informada pela TheBiker'),
    'limits.maxSystemWeight': c(128, 'kg')
  }},
  'bicicleta-scott-scale-980-blue': { source: 'store', facts: {
    'identity.color': c('Blue'), 'frame.material': c('Scale Alloy 6061 Custom Butted Tubing'),
    'suspension.fork': c('Suntour X1 32 RL-R'), 'suspension.frontTravel': c(100, 'mm'),
    'drivetrain.rearDerailleur': c('Shimano Deore RD-M6100'), 'drivetrain.speeds': c(12, 'velocidades'),
    'drivetrain.crankset': c('Shimano FC-MT512-1'), 'brakes.calipers': c('Shimano MT200'),
    'tires': c('Maxxis Rekon Race 29x2.4'), 'weight.approximate': a(14.3, 'kg', 'Configuração tubeless informada pela TheBiker'),
    'limits.maxSystemWeight': c(128, 'kg')
  }},
  'bicicleta-infantil-oggi-hacker-24-cinza-e-amarelo': { source: 'store', facts: {
    'identity.color': c('Cinza e amarelo'), 'wheels.size': c(24, 'pol'), 'commercial.unitsObserved': c(1, 'unidade', 'Estoque observado; revalidar antes de publicar'),
    'frame.material': c('Alumínio 6061 T6'), 'suspension.fork': c('Oggi 24'), 'suspension.frontTravel': c(50, 'mm'),
    'drivetrain.speeds': c(21, 'marchas'), 'drivetrain.brand': c('Shimano'), 'brakes.type': c('disco'),
    'tires': c('Kenda MTB 24'), 'weight.approximate': a(12.8, 'kg', 'Peso aproximado informado pela TheBiker')
  }}
}

let changed = 0
for (const [id, config] of Object.entries(records)) {
  const target = path.join(directory, `${id}.json`)
  const record = validateProductKnowledgeRecord(JSON.parse(fs.readFileSync(target, 'utf8')))
  const sourceId = `${config.source === 'manufacturer' ? 'manufacturer' : 'thebiker'}-${id}`
  const buildFacts = (values, selectedSourceId) => Object.fromEntries(Object.entries(values || {}).map(([key, [value, unit, status, qualifier]]) => [key, { value, unit, status, sourceIds: [selectedSourceId], observedAt, market: 'BR', qualifier }]))
  const facts = { ...buildFacts(config.facts, sourceId), ...buildFacts(config.storeFacts, `thebiker-${id}`) }
  const unresolvedFields = config.source === 'manufacturer' ? record.unresolvedFields.filter((field) => field !== 'manufacturerSpecifications') : record.unresolvedFields
  const updated = validateProductKnowledgeRecord({ ...record, facts: { ...record.facts, ...facts }, unresolvedFields, history: [...new Map([...record.history, { researchSlug: 'remaining-catalog-specifications', syncedAt: observedAt }].map((entry) => [`${entry.researchSlug}:${entry.syncedAt}`, entry])).values()] })
  const output = JSON.stringify(updated, null, 2) + '\n'
  if (check) {
    if (Object.entries(facts).some(([key, value]) => JSON.stringify(record.facts[key]) !== JSON.stringify(value))) process.exitCode = 1
  } else if (fs.readFileSync(target, 'utf8') !== output) {
    fs.writeFileSync(target, output)
    changed++
  }
}
console.log(`${Object.keys(records).length} fichas restantes enriquecidas; ${changed} atualizadas.`)
