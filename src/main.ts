import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

import listingsRoutes from "./routes/listings";

dotenv.config();

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  app.get("/health", async () => {
    return {
      ok: true,
      service: "metazeka-backend",
      time: new Date().toISOString(),
    };
  });

  app.post("/api/whatif/simulate", async (req) => {
    const body = (req.body ?? {}) as any;

    if (!body?.baseline?.revenue || !body?.baseline?.net_profit) {
      return { ok: false, error: "baseline.revenue ve baseline.net_profit zorunlu" };
    }

    return {
      ok: true,
      scenarioId: `SIM-${Math.floor(Math.random() * 9000) + 1000}`,
      received: body,
      message: "Mock engine çalıştı. Sonraki adım: Gemini API proxy bağlamak.",
    };
  });

  // ✅ Listings CRUD
  await app.register(listingsRoutes, { prefix: "/api/listings" });

  const PORT = Number(process.env.PORT || 8787);
  const HOST = process.env.HOST || "0.0.0.0";

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`✅ Server running: http://localhost:${PORT}`);
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
