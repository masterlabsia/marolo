import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "./shared/database";
import { createApp } from "./shared/app";

const PORT = process.env.PORT ?? 5000;

async function main() {
  await AppDataSource.initialize();
  console.log("✅ Banco de dados conectado");

  const app = await createApp();
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 REST disponível em http://localhost:${PORT}/api`);
    console.log(`🚀 GraphQL disponível em http://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error("Erro ao iniciar servidor:", err);
  process.exit(1);
});
