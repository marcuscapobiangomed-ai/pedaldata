import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(
  homepage,
  /assign recent_posts = published_posts \| slice: 0, 4/,
  "A home deve derivar os posts recentes da lista dinâmica de posts publicados."
);
assert.match(
  homepage,
  /for post in recent_posts/,
  "A home deve renderizar a lista de posts recentes."
);
assert.match(
  homepage,
  /href="\{\{ site\.baseurl \}\}\{\{ post\.url \}\}"/,
  "Cada post recente deve apontar para sua URL publicada."
);
assert.match(
  homepage,
  /post\.thumbnail \| default: post\.image/,
  "Posts recentes devem usar thumbnail com fallback para a imagem principal."
);

console.log("✓ Homepage inclui automaticamente os quatro posts publicados mais recentes");
