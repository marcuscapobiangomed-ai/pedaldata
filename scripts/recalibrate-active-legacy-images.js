import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { produceOfficialCampaignImage } from "../bot/src/images/official-campaign-image.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const approvedAt = new Date().toISOString().slice(0, 10);

const targets = [
  {
    file: "_posts/2026-07-16-bem-vindo.md",
    id: "bem-vindo-pedal-data",
    title: "TheBiker: conhecimento técnico para quem leva o ciclismo a sério",
    summary: "Manifesto editorial do blog oficial TheBiker para ciclismo de alta performance.",
    productIds: ["foil-rc-hmx-sl-bicicleta-aero-24v-sram-red-axs"],
  },
  {
    file: "_posts/2026-07-17-25-melhores-apps-de-treino-para-ciclismo-2026-comparativo-entre-zwift-trainerroad-trainingpeaks-e-mywhoosh.md",
    id: "melhores-apps-treino-ciclismo-2026",
    title: "Melhores Apps de Treino para Ciclismo 2026",
    summary: "Treino indoor estruturado, conectividade e análise de desempenho.",
    productIds: ["rolo-de-treino-elite-novo-force"],
  },
  {
    file: "_posts/2026-07-18-26-guia-de-manutenção-básica-para-bike-de-estrada-o-que-todo-ciclista-precisa-saber.md",
    id: "guia-manutencao-basica",
    title: "Guia de Manutenção Básica para Bike de Estrada",
    summary: "Limpeza, inspeção e ferramentas para manutenção de bicicletas.",
    productIds: ["kit-de-escovas-muc-off"],
  },
  {
    file: "_posts/2026-07-21-29-melhores-estradas-e-rotas-para-ciclismo-de-estrada-no-brasil-guia-por-região.md",
    id: "melhores-estradas-rotas-brasil",
    title: "Melhores Estradas e Rotas para Ciclismo de Estrada no Brasil",
    summary: "Ciclismo de estrada, segurança e equipamento para pedais longos.",
    productIds: ["bicicleta-scott-addict-50-2026-pre-venda-cumulus-white"],
  },
];

function setField(content, field, value) {
  const delimiter = content.indexOf("\n---", 3);
  if (delimiter < 0) throw new Error("Frontmatter inválido");
  const head = content.slice(0, delimiter);
  const tail = content.slice(delimiter);
  const pattern = new RegExp(`^${field}:.*$`, "m");
  return pattern.test(head)
    ? `${head.replace(pattern, `${field}: ${value}`)}${tail}`
    : `${head}\n${field}: ${value}${tail}`;
}

function quote(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

for (const target of targets) {
  const generated = await produceOfficialCampaignImage({ root, item: target, approvedAt, force: true });
  let content = await fs.readFile(path.join(root, target.file), "utf8");
  const base = generated.publicBase;
  const manifest = generated.manifest;
  const fields = {
    image: quote(`${base}/${manifest.files.hero.file}`),
    image_mobile: quote(`${base}/${manifest.files.mobile.file}`),
    thumbnail: quote(`${base}/${manifest.files.card.file}`),
    image_manifest_version: "2",
    image_asset_type: quote(manifest.assetType),
    image_status: quote("approved"),
    image_alt: quote(manifest.alt),
    image_caption: quote(manifest.caption),
    image_credit: quote(manifest.credit),
    image_license: quote(manifest.source.license),
  };
  for (const [field, value] of Object.entries(fields)) content = setField(content, field, value);
  await fs.writeFile(path.join(root, target.file), content, "utf8");
  console.log(`✅ ${target.id}: ${manifest.matchedProduct.name}`);
}
