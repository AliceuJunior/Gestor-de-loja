import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { inicializarBancoDeDados } from "./server/db.ts";
import { apiRouter } from "./server/routes.ts";

async function startServer() {
  console.log("🚀 [Servidor] Iniciando o servidor Full-Stack do Gestor da Loja...");

  // 1. Inicializar e verificar tabelas do Banco de Dados
  try {
    await inicializarBancoDeDados();
  } catch (err) {
    console.error("❌ Erro fatal ao inicializar o banco de dados:", err);
  }

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Configuração básica do express
  app.use(express.json({ limit: '10mb' }));

  // 2. Acoplar rotas de API ANTES do middleware do Vite / arquivos estáticos
  app.use("/api", apiRouter);

  // Rota de saúde simples
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend funcionando perfeitamente!" });
  });

  // 3. Configurar Vite como Middleware (Desenvolvimento) ou Servidor de Estáticos (Produção)
  if (process.env.NODE_ENV !== "production") {
    console.log("⚙️ [Vite] Servidor rodando em modo DESENVOLVIMENTO. Iniciando middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 [Vite] Servidor rodando em modo PRODUÇÃO. Servindo arquivos compilados...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve os arquivos estáticos da pasta dist
    app.use(express.static(distPath));
    
    // Roteia qualquer outra requisição para o index.html (comportamento de SPA)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 4. Iniciar escuta na porta 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ [Servidor] Servidor rodando com sucesso em http://0.0.0.0:${PORT}`);
  });
}

startServer();
