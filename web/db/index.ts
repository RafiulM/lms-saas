import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:data/lms.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

try {
  client.execute("PRAGMA journal_mode = WAL");
  client.execute("PRAGMA foreign_keys = ON");
} catch {
  // pragmas only apply to local file databases
}

export const db = drizzle({ client, schema });

export { schema };
