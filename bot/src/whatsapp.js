import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const AUTHORIZED_NUMBERS = new Set(
  (process.env.AUTHORIZED_WHATSAPP_NUMBERS || process.env.ALLOWED_NUMBERS || "")
    .split(",")
    .map(n => n.trim())
    .filter(Boolean)
);

const DAILY_LIMIT = parseInt(process.env.DAILY_REQUEST_LIMIT || "10", 10);
const requestCounts = new Map();

function checkRateLimit(from) {
  const today = new Date().toISOString().split("T")[0];
  const key = `${from}:${today}`;
  const count = requestCounts.get(key) || 0;
  if (count >= DAILY_LIMIT) return false;
  requestCounts.set(key, count + 1);
  return true;
}

export class WhatsAppBot {
  constructor(onMessage) {
    this.onMessage = onMessage;
    this.client = null;
  }

  isAuthorized(from) {
    if (AUTHORIZED_NUMBERS.size === 0) return true;
    const number = from.replace(/\D/g, "");
    for (const allowed of AUTHORIZED_NUMBERS) {
      if (number.endsWith(allowed.replace(/\D/g, ""))) return true;
    }
    return false;
  }

  async start() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "medblog-client" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    this.client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
      console.log("\n📱 Escaneie o QR Code com seu WhatsApp");
      console.log("   (Três pontos → WhatsApp Web)\n");
    });

    this.client.on("ready", () => {
      console.log("✅ WhatsApp conectado!");
      console.log("📲 Envie um caso clínico para transformar em post!\n");
    });

    this.client.on("message", async (msg) => {
      if (msg.from.includes("status") || msg.fromMe) return;
      if (msg.from.endsWith("@g.us")) {
        console.log(`⛔ Mensagem ignorada de grupo: ${msg.from}`);
        return;
      }
      if (!this.isAuthorized(msg.from)) {
        console.warn(`⛔ Mensagem não autorizada de ${msg.from}`);
        return;
      }
      if (!checkRateLimit(msg.from)) {
        console.warn(`⛔ Limite diário excedido para ${msg.from}`);
        await msg.reply(`❌ Limite diário de ${DAILY_LIMIT} solicitações atingido. Tente novamente amanhã.`);
        return;
      }
      if (this.onMessage) {
        await this.onMessage({
          from: msg.from,
          body: msg.body,
          reply: (text) => msg.reply(text),
        });
      }
    });

    this.client.on("disconnected", (reason) => {
      console.log("❌ WhatsApp desconectado:", reason);
    });

    await this.client.initialize();
    return this;
  }

  async sendMessage(to, text) {
    if (this.client) await this.client.sendMessage(to, text);
  }

  async stop() {
    if (this.client) await this.client.destroy();
  }
}
