/**
 * Converte um artigo JSON estruturado em Markdown Jekyll.
 * Ex.: node src/generator.js < input.json > output.md
 */
import { validateArticle } from "./schemas/article.schema.js";

const escapeYaml = (s) => (s || "").replace(/"/g, '\\"');

export function generateMarkdown(article) {
  const data = validateArticle(article);
  const today = new Date().toISOString().split("T")[0];

  const frontmatter = [
    "---",
    'layout: post',
    `title: "${escapeYaml(data.title)}"`,
    `date: ${today}`,
    `tags: [${data.tags.join(", ")}]`,
    `description: "${escapeYaml(data.description)}"`,
    `category: ${data.category}`,
    `status: draft`,
    `weight: "${escapeYaml(data.frontmatter.weight)}"`,
    `price: "${escapeYaml(data.frontmatter.price)}"`,
    `author: "${escapeYaml(data.frontmatter.author)}"`,
    `image: "${escapeYaml(data.frontmatter.image)}"`,
    `image_alt: "${escapeYaml(data.frontmatter.image_alt)}"`,
    "---",
    "",
  ].join("\n");

  let body = "";

  // Aviso metodológico
  if (data.methodologyNotice) {
    body += `> **Nota:** ${data.methodologyNotice}\n\n`;
  }

  // Seções
  for (const section of data.sections) {
    body += `## ${section.heading}\n\n${section.content}\n\n`;
  }

  // Claims que precisam revisão
  if (data.claimsRequiringReview.length > 0) {
    body += "<!-- Pontos que precisam de revisão humana:\n";
    for (const claim of data.claimsRequiringReview) {
      body += `  - ${claim}\n`;
    }
    body += "-->\n\n";
  }

  return frontmatter + body;
}

// CLI
if (process.argv[1] && process.argv[1].includes("generator.js")) {
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    try {
      const article = JSON.parse(input);
      console.log(generateMarkdown(article));
    } catch (err) {
      console.error("Erro:", err.message);
      process.exit(1);
    }
  });
}
