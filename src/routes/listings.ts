
import type { FastifyPluginAsync } from "fastify";
import { createClient } from "@supabase/supabase-js";

const listingsRoutes: FastifyPluginAsync = async (app) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // GET /api/listings?user_id=...&limit=50
  app.get("/", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const userId = String(q.user_id || "");
    const limit = Number(q.limit || 50);

    if (!userId) return reply.code(400).send({ ok: false, error: "user_id required" });

    const { data, error } = await supabase
      .from("user_listings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return reply.code(500).send({ ok: false, error: error.message });
    return { ok: true, data };
  });

  // GET /api/listings/:id
  app.get("/:id", async (req, reply) => {
    const { id } = (req.params ?? {}) as any;

    const { data, error } = await supabase
      .from("user_listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return reply.code(404).send({ ok: false, error: error.message });
    return { ok: true, data };
  });

  // POST /api/listings
  app.post("/", async (req, reply) => {
    const b = (req.body ?? {}) as any;
    const { user_id, title, description } = b;

    if (!user_id || !title) {
      return reply.code(400).send({ ok: false, error: "user_id and title required" });
    }

    const { data, error } = await supabase
      .from("user_listings")
      .insert([{ user_id, title, description }])
      .select("*")
      .single();

    if (error) return reply.code(500).send({ ok: false, error: error.message });
    return reply.code(201).send({ ok: true, data });
  });

  // PUT /api/listings/:id
  app.put("/:id", async (req, reply) => {
    const { id } = (req.params ?? {}) as any;
    const b = (req.body ?? {}) as any;

    const patch: any = {};
    if (typeof b.title !== "undefined") patch.title = b.title;
    if (typeof b.description !== "undefined") patch.description = b.description;

    const { data, error } = await supabase
      .from("user_listings")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return reply.code(500).send({ ok: false, error: error.message });
    return { ok: true, data };
  });

  // DELETE /api/listings/:id
  app.delete("/:id", async (req, reply) => {
    const { id } = (req.params ?? {}) as any;

    const { error } = await supabase.from("user_listings").delete().eq("id", id);

    if (error) return reply.code(500).send({ ok: false, error: error.message });
    return { ok: true };
  });
};

export default listingsRoutes;
