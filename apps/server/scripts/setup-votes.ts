import { createClient } from "redis";
import { loadEnv } from "../src/env.ts";

// Local maintenance only. The app never needs administrator credentials.
const { VOTES_REDIS_URL } = loadEnv();
if (!VOTES_REDIS_URL) throw new Error("VOTES_REDIS_URL doit être définie dans le .env local.");
const target = new URL(VOTES_REDIS_URL);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.username !== "atreia-votes" || !target.password) {
  throw new Error("Cette commande est réservée au compte atreia-votes du Redis local.");
}
const admin = createClient({ url: process.env.REDIS_ADMIN_URL || `redis://127.0.0.1:${target.port || "6379"}`, socket: { connectTimeout: 2000, reconnectStrategy: false } });
admin.on("error", () => {});
try {
  await admin.connect();
  await admin.sendCommand(["ACL", "SETUSER", "atreia-votes", "reset", "on", `>${decodeURIComponent(target.password)}`, "~atreia:class-votes:*", "+ping", "+client|setinfo", "+hmget", "+hget", "+hincrby", "+hset", "+eval", "+incr", "+expire"]);
  console.log("Compte local atreia-votes rétabli, accès limité aux clés de vote Atreia.");
} finally {
  if (admin.isOpen) admin.destroy();
}
