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

  async publishPost(postContent, slug) {
    const repoDir = path.join(process.cwd(), "repo");
    await fs.mkdir(repoDir, { recursive: true });

    const hasGit = await fs.stat(path.join(repoDir, ".git")).then(() => true).catch(() => false);

    if (!hasGit) {
      await fs.rm(repoDir, { recursive: true, force: true });
      await simpleGit().clone(this.getRepoUrl(), repoDir);
    }

    const git = simpleGit(repoDir);
    await git.addConfig("user.email", `${this.user}@users.noreply.github.com`);
    await git.addConfig("user.name", this.user);
    await git.pull("origin", this.branch);

    const postsDir = path.join(repoDir, "_posts");
    await fs.mkdir(postsDir, { recursive: true });

    const fileName = `${new Date().toISOString().split("T")[0]}-${slug}.md`;
    const filePath = path.join(postsDir, fileName);
    await fs.writeFile(filePath, postContent, "utf-8");

    await git.add("./_posts/" + fileName);
    await git.commit(`📝 Novo post: ${slug}`);
    await git.push("origin", this.branch);

    const today = new Date();
    const postUrl = `${this.baseUrl}/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${slug}/`;
    return postUrl;
  }
}
