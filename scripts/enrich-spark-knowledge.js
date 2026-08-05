import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateProductKnowledgeRecord } from '../bot/src/schemas/product-knowledge.schema.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const directory = path.join(root, '_data/product-knowledge/bikes')
const check = process.argv.includes('--check')
const observedAt = '2026-08-04'

const specs = {
  'bicicleta-scott-spark-rc-world-cup-2027': {
    'identity.manufacturerModelCode': ['425328', null], 'identity.color': ['carbon black', null], 'identity.sizes': [['S', 'M', 'L', 'XL'], null],
    'frame.material': ['Spark RC Carbon HMF', null], 'frame.rearAxle': ['12x148', 'mm'], 'suspension.frontTravel': [120, 'mm'], 'suspension.rearTravel': [120, 'mm'],
    'suspension.fork': ['RockShox SID 3P Air, Rush RL 3-Mode', null], 'suspension.rearShock': ['RockShox NUDE 5 RL3 Trunnion', null],
    'drivetrain.rearDerailleur': ['SRAM S1000 Eagle AXS Transmission', null], 'drivetrain.speeds': [12, 'velocidades'], 'drivetrain.shifting': ['wireless electronic', null],
    'drivetrain.crankset': ['SRAM Eagle 70 Transmission, 34T', null], 'drivetrain.cassette': ['SRAM Eagle XS 1270 V2, 10-52', null],
    'brakes.calipers': ['SRAM DB6 4-Piston Disc', null], 'brakes.rotors': ['SRAM Centerline CL 180 mm dianteiro / 160 mm traseiro', null],
    'wheels.wheelset': ['Syncros Silverton 2.5-30 CL, tubeless ready', null], 'tires': ['Maxxis Rekon Race 29x2.4, 120 TPI, tubeless ready, EXO', null],
    'weight.approximate': [12.5, 'kg', 'approximate', 'Configuração tubeless declarada pelo fabricante'], 'limits.maxSystemWeight': [130, 'kg']
  },
  'bicicleta-scott-spark-rc-expert-2027': {
    'frame.material': ['Spark RC HMF Carbon Gen5', null], 'frame.rearAxle': ['12x148', 'mm'], 'suspension.frontTravel': [120, 'mm'], 'suspension.rearTravel': [120, 'mm'],
    'suspension.fork': ['Fox 34SL Factory Grip SL, Kashima, 3P', null], 'suspension.rearShock': ['Fox Float Factory Traction Control EVOL, Kashima', null],
    'drivetrain.rearDerailleur': ['Shimano XT Di2 RD-M8250', null], 'drivetrain.speeds': [12, 'velocidades'], 'drivetrain.shifting': ['wireless electronic', null],
    'drivetrain.crankset': ['Shimano XT FC-M8200, 34T', null], 'drivetrain.cassette': ['Shimano Deore CS-M7200, 10-51T', null],
    'brakes.calipers': ['Shimano Deore BR-M6220 4-Piston', null], 'brakes.rotors': ['Shimano RT-CL700 180 mm dianteiro / 160 mm traseiro', null],
    'wheels.wheelset': ['Syncros Silverton AL2, 30 mm, tubeless ready', null], 'tires': ['Maxxis Aspen 29x2.4, 120 TPI, tubeless ready, EXO', null],
    'weight.approximate': [11.8, 'kg', 'approximate', 'Configuração tubeless declarada pelo fabricante'], 'limits.maxSystemWeight': [130, 'kg']
  },
  'bicicleta-scott-spark-rc-world-cup-20271': {
    'identity.manufacturerModelCode': ['290103', null], 'identity.sizes': [['S', 'M', 'L', 'XL'], null],
    'frame.material': ['Spark RC Carbon HMX', null], 'frame.rearAxle': ['12x148', 'mm'], 'suspension.frontTravel': [120, 'mm'], 'suspension.rearTravel': [120, 'mm'],
    'suspension.fork': ['RockShox SID Select+ RL3 Air', null], 'suspension.rearShock': ['RockShox NUDE 5 RL3 Trunnion', null],
    'drivetrain.rearDerailleur': ['SRAM X01 Eagle AXS', null], 'drivetrain.speeds': [12, 'velocidades'], 'drivetrain.shifting': ['wireless electronic', null],
    'drivetrain.crankset': ['SRAM X01 DUB Eagle Carbon, 32T', null], 'drivetrain.cassette': ['SRAM X01 XG1295, 10-52T', null],
    'brakes.calipers': ['SRAM Level TLM Disc', null], 'brakes.rotors': ['SRAM HS2 180 mm dianteiro / 160 mm traseiro', null],
    'wheels.wheelset': ['Syncros Silverton 1.0-30, aro de carbono tubeless ready', null], 'tires': ['Maxxis Rekon Race 29x2.4, 120 TPI, tubeless ready, EXO', null],
    'weight.approximate': [10.9, 'kg', 'approximate', 'Configuração tubeless declarada pelo fabricante'], 'limits.maxSystemWeight': [128, 'kg']
  }
}

let changed = 0
for (const [id, values] of Object.entries(specs)) {
  const target = path.join(directory, `${id}.json`)
  const record = validateProductKnowledgeRecord(JSON.parse(fs.readFileSync(target, 'utf8')))
  const sourceId = `manufacturer-${id}`
  const facts = Object.fromEntries(Object.entries(values).map(([key, [value, unit, status = 'confirmed', qualifier = null]]) => [key, { value, unit, status, sourceIds: [sourceId], observedAt, market: 'BR', qualifier }]))
  const updated = validateProductKnowledgeRecord({ ...record, facts: { ...record.facts, ...facts }, unresolvedFields: record.unresolvedFields.filter((field) => field !== 'manufacturerSpecifications'), history: [...new Map([...record.history, { researchSlug: 'scott-spark-official-specifications', syncedAt: observedAt }].map((entry) => [`${entry.researchSlug}:${entry.syncedAt}`, entry])).values()] })
  const output = JSON.stringify(updated, null, 2) + '\n'
  if (check) {
    if (Object.entries(facts).some(([key, value]) => JSON.stringify(record.facts[key]) !== JSON.stringify(value))) process.exitCode = 1
  } else if (fs.readFileSync(target, 'utf8') !== output) {
    fs.writeFileSync(target, output)
    changed++
  }
}
console.log(`3 fichas Spark enriquecidas; ${changed} atualizadas.`)
