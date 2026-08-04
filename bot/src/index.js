import "dotenv/config";

function main() {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log("ℹ️ Integração com WhatsApp desativada.");
    console.log("Use `npm run post:manual` ou `npm run batch` para o fluxo editorial.");
    return;
  }

  console.error("❌ Integração com WhatsApp isolada por segurança.");
  console.error("A reativação exige revisão explícita das dependências do adaptador.");
  process.exitCode = 1;
}

main();
