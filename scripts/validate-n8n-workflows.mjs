import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'automation/n8n/workflows');
const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.json'));
assert.equal(files.length, 2, 'o pacote deve conter o fluxo principal e o tratador de erros');

for (const file of files) {
  const raw = await fs.readFile(path.join(directory, file), 'utf8');
  const workflow = JSON.parse(raw);
  assert.equal(workflow.active, false, `${file}: importação precisa começar desativada`);
  assert.equal(workflow.settings?.timezone, 'America/Sao_Paulo', `${file}: timezone incorreto`);
  const names = new Set(workflow.nodes.map((node) => node.name));
  assert.equal(names.size, workflow.nodes.length, `${file}: nomes de nós duplicados`);
  for (const [source, outputs] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source), `${file}: origem de conexão inexistente: ${source}`);
    for (const branch of outputs.main || []) for (const target of branch || []) assert.ok(names.has(target.node), `${file}: destino inexistente: ${target.node}`);
  }
  for (const codeNode of workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.code')) {
    assert.doesNotThrow(
      () => new Function(codeNode.parameters?.jsCode || ''),
      `${file}: JavaScript inválido no nó ${codeNode.name}`,
    );
  }
  assert.doesNotMatch(raw, /AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[0-9A-Za-z]{20,}|Bearer\s+[0-9A-Za-z._-]{20,}/, `${file}: possível credencial embutida`);
  assert.doesNotMatch(raw, new RegExp(['pedal', 'data'].join(''), 'i'), `${file}: identidade legada encontrada`);
}

const main = JSON.parse(await fs.readFile(path.join(directory, 'thebiker-seo-youtube-intelligence.json'), 'utf8'));
const types = new Set(main.nodes.map((node) => node.type));
assert.ok(types.has('n8n-nodes-base.scheduleTrigger'));
assert.ok(main.nodes.some((node) => node.name === 'Search Console atual'));
assert.ok(main.nodes.some((node) => node.name === 'Search Console resumo Brasil atual'));
assert.ok(main.nodes.some((node) => node.name === 'Search Console resumo global atual'));
assert.ok(main.nodes.some((node) => node.name === 'Google Trends RSS Brasil'));
assert.ok(main.nodes.some((node) => node.name === 'YouTube busca por visualizações'));
assert.ok(main.nodes.some((node) => node.name === 'YouTube populares em esportes'));
assert.ok(main.nodes.some((node) => node.name === 'Gerar relatório e pautas'));
assert.match(JSON.stringify(main), /autoPublish/);
assert.match(JSON.stringify(main), /autoScheduleAfterGates/);
assert.match(JSON.stringify(main), /competitorPromotionBlocked/);
assert.match(JSON.stringify(main), /googleTrendsDoesNotFillMeasuredSeo/);

const errors = JSON.parse(await fs.readFile(path.join(directory, 'thebiker-intelligence-errors.json'), 'utf8'));
assert.ok(errors.nodes.some((node) => node.type === 'n8n-nodes-base.errorTrigger'));
console.log('Workflows n8n validados com sucesso.');
