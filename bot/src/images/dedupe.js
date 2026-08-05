import crypto from "node:crypto";
import sharp from "sharp";

export function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function perceptualHash(buffer) {
  const { data } = await sharp(buffer).rotate().greyscale().resize(8, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const average = [...data].reduce((sum, value) => sum + value, 0) / data.length;
  return [...data].map((value) => value >= average ? "1" : "0").join("");
}

export function hammingDistance(left, right) {
  if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) distance += 1;
  return distance;
}

// Average-hash is intentionally conservative here: bicycle packshots share a
// large white background and a similar silhouette. A threshold above 3 was
// rejecting distinct models and forcing the selector onto arbitrary detail
// shots later in the gallery.
export function assertNotDuplicate(candidate, assets, { perceptualThreshold = 3, windowDays = 60, now = new Date(), excludePostId = null } = {}) {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays);
  for (const asset of assets) {
    if (excludePostId && (asset.uses || []).some((use) => use.postId === excludePostId)) continue;
    const recentUse = (asset.uses || []).some((use) => new Date(use.usedAt) >= cutoff);
    if (!recentUse) continue;
    if (asset.sha256 === candidate.sha256) throw new Error(`Imagem duplicada: ${asset.assetId}`);
    if (hammingDistance(asset.perceptualHash, candidate.perceptualHash) <= perceptualThreshold) {
      throw new Error(`Imagem visualmente repetida: ${asset.assetId}`);
    }
  }
}
