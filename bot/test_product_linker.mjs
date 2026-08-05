import assert from "node:assert/strict";
import { linkTheBikerProducts } from "./src/editorial/product-linker.js";

const rules = {
  storeHost: "thebikershop.com.br",
  maxLinksPerPost: 2,
  blockedContextBrands: ["Trek"],
  categories: [
    { terms: ["pedivela", "pedivelas"], url: "https://thebikershop.com.br/componentes/pedivela/" },
    { terms: ["cassete"], url: "https://thebikershop.com.br/componentes/cassetes/" },
  ],
};
const products = [{ name: "Pedivela Shimano 105 R7100", productUrl: "https://thebikershop.com.br/produtos/pedivela-shimano-105-r7100/" }];

const markdown = `---\ntitle: "Pedivela Shimano 105 R7100"\n---\n# Pedivela Shimano 105 R7100\n\nO Pedivela Shimano 105 R7100 trabalha com cassete. Outro pedivela não deve repetir o link.\n\n## Fontes\n\n- Pedivela Shimano 105 R7100\n`;
const linked = linkTheBikerProducts(markdown, { products, rules });
assert.equal(linked.links.length, 2);
assert.match(linked.content, /href="https:\/\/thebikershop\.com\.br\/produtos\/pedivela-shimano-105-r7100\/"[^>]*>Pedivela Shimano 105 R7100<\/a>/);
assert.match(linked.content, /href="https:\/\/thebikershop\.com\.br\/componentes\/cassetes\/"[^>]*>cassete<\/a>/);
assert.ok(!linked.content.match(/title: "<a/));
assert.match(linked.content, /## Fontes\n\n- Pedivela Shimano 105 R7100/);
assert.deepEqual(linkTheBikerProducts(linked.content, { products, rules }).content, linked.content);

const competitor = linkTheBikerProducts("A Trek usa pedivela próprio.", { products: [], rules });
assert.equal(competitor.links.length, 0);

assert.throws(() => linkTheBikerProducts("Pedivela X", {
  products: [{ name: "Pedivela X", productUrl: "https://concorrente.example/produto" }],
  rules,
}), /Link externo/);

console.log("✅ Product linker tests passed");
