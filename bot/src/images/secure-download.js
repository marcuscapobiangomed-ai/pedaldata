import dns from "node:dns/promises";
import net from "node:net";

function privateAddress(address) {
  if (net.isIP(address) === 4) {
    return /^(10\.|127\.|169\.254\.|192\.168\.)/.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address);
  }
  return address === "::1" || /^f[cd]/i.test(address) || /^fe80:/i.test(address);
}

async function assertPublicHost(hostname, allowedHosts) {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  if (!allowedHosts.some((host) => normalized === host || normalized.endsWith(`.${host}`))) {
    throw new Error(`Host de imagem não permitido: ${hostname}`);
  }
  if (net.isIP(hostname)) throw new Error("URL de imagem não pode usar IP literal");
  const addresses = await dns.lookup(hostname, { all: true });
  if (addresses.some(({ address }) => privateAddress(address))) throw new Error(`Host de imagem resolveu para rede privada: ${hostname}`);
}

export async function secureDownloadImage(url, config, { fetchImpl = fetch, redirects = 0 } = {}) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Imagem externa exige HTTPS");
  await assertPublicHost(parsed.hostname, config.allowedAssetHosts);
  const response = await fetchImpl(parsed, {
    redirect: "manual",
    headers: { "user-agent": "TheBikerBlogMediaBot/1.0", accept: "image/avif,image/webp,image/jpeg,image/png" },
    signal: AbortSignal.timeout(25000),
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 3) throw new Error("Imagem excedeu o limite de redirecionamentos");
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirecionamento de imagem sem destino");
    return secureDownloadImage(new URL(location, parsed).href, config, { fetchImpl, redirects: redirects + 1 });
  }
  if (!response.ok) throw new Error(`Download da imagem: HTTP ${response.status}`);
  const contentType = String(response.headers.get("content-type") || "").split(";")[0];
  if (!new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(contentType)) throw new Error(`MIME de imagem não permitido: ${contentType}`);
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > config.maximumDownloadBytes) throw new Error("Imagem excede o limite de download");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > config.maximumDownloadBytes) throw new Error("Imagem vazia ou excessiva");
  return { buffer, contentType, finalUrl: parsed.href };
}
