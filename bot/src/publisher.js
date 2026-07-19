import fs from "fs/promises";
import path from "path";

export class GitHubPublisher {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.user = process.env.GITHUB_USER;
    this.repo = process.env.GITHUB_REPO;
    this.branch = process.env.GITHUB_BRANCH || "main";
    this.baseUrl = process.env.BLOG_URL;
    this.apiBase = `https://api.github.com/repos/${this.user}/${this.repo}`;
  }

  async _api(method, urlPath, body) {
    const url = `${this.apiBase}${urlPath}`;
    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "pedaldata-bot",
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async _getSha(pathInRepo) {
    try {
      const data = await this._api("GET", `/contents/${pathInRepo}?ref=${this.branch}`);
      return data.sha;
    } catch {
      return null;
    }
  }

  async _createBranch(branchName) {
    // Obtém o SHA do branch base
    const refData = await this._api("GET", `/git/refs/heads/${this.branch}`);
    const baseSha = refData.object.sha;

    // Cria novo branch
    try {
      await this._api("POST", "/git/refs", {
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });
    } catch (err) {
      // Se o branch já existe, ignora
      if (!err.message.includes("422")) throw err;
    }
  }

  async publishPost(postContent, slug) {
    const today = new Date().toISOString().split("T")[0];
    const fileName = `${today}-${slug}.md`;
    const pathInRepo = `_posts/${fileName}`;
    const branchName = `posts/${slug}`;

    console.log(`🌿 Criando branch: ${branchName}`);
    await this._createBranch(branchName);

    // Verifica SHA para update (caso já exista)
    let sha = await this._getSha(pathInRepo);

    // Commit do arquivo no novo branch
    console.log(`📝 Commitando ${pathInRepo} em ${branchName}`);
    const body = {
      message: `📝 Draft: ${slug}`,
      content: Buffer.from(postContent, "utf-8").toString("base64"),
      branch: branchName,
    };
    if (sha) body.sha = sha;
    await this._api("PUT", `/contents/${pathInRepo}`, body);

    // Cria PR
    console.log(`🔀 Criando PR: ${branchName} → ${this.branch}`);
    const prData = await this._api("POST", "/pulls", {
      title: `[Draft] ${slug.replace(/-/g, " ")}`,
      head: branchName,
      base: this.branch,
      body: [
        "## 🤖 Post gerado automaticamente",
        "",
        "Este PR foi criado pelo bot do Pedal Data.",
        "",
        "### Revisão necessária:",
        "- [ ] Verificar informações técnicas",
        "- [ ] Confirmar preços e fontes",
        "- [ ] Revisar gramática e estilo",
        "- [ ] Alterar `status: draft` para `status: published` no frontmatter",
        "- [ ] Adicionar imagem destacada se necessário",
        "",
        "Após revisão, faça merge para publicar.",
      ].join("\n"),
    });

    console.log(`✅ PR criado: ${prData.html_url}`);
    return prData.html_url;
  }
}
