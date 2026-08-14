import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/db/schema";

const dbUrl = process.env.DATABASE_URL ?? "file:data/lms.db";

const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

if (dbUrl.startsWith("file:")) {
  void client.execute("PRAGMA journal_mode = WAL").catch(() => {});
  void client.execute("PRAGMA foreign_keys = ON").catch(() => {});
}

export const db = drizzle({ client, schema });

export { schema };
