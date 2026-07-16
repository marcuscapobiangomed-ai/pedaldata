import simpleGit from "simple-git";
import fs from "fs/promises";
import path from "path";

export class GitHubPublisher {
  constructor() {
    this.gitToken = process.env.GITHUB_TOKEN;
    this.user = process.env.GITHUB_USER;
    this.repo = process.env.GITHUB_REPO;
    this.branch = process.env.GITHUB_BRANCH || "main";
    this.baseUrl = process.env.BLOG_URL;
  }

  getRepoUrl() {
    return `https://${this.user}:${this.gitToken}@github.com/${this.user}/${this.repo}.git`;
  }

  getPostsDir() {
    const repoDir = path.join(process.cwd(), "repo");
    return path.join(repoDir, "_posts");
  }

  async publishPost(postContent, slug) {
    const repoDir = path.join(process.cwd(), "repo");
    const postsDir = this.getPostsDir();

    try {
      await fs.mkdir(postsDir, { recursive: true });

      const fileName = `${new Date().toISOString().split("T")[0]}-${slug}.md`;
      const filePath = path.join(postsDir, fileName);
      await fs.writeFile(filePath, postContent, "utf-8");

      const git = simpleGit(repoDir);

      if (!(await fs.stat(path.join(repoDir, ".git")).catch(() => null))) {
        await git.clone(this.getRepoUrl(), repoDir);
        await fs.writeFile(filePath, postContent, "utf-8");
      }

      await git.add("./_posts/" + fileName);
      await git.commit(`📝 Novo post: ${slug}`);
      await git.push("origin", this.branch);

      const postUrl = `${this.baseUrl}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${slug}/`;
      return postUrl;
    } catch (err) {
      throw new Error(`Erro ao publicar no GitHub: ${err.message}`);
    }
  }
}
