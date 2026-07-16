import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

export class WhatsAppBot {
  constructor(onMessage) {
    this.onMessage = onMessage;
    this.client = null;
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
