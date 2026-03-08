import { drizzle } from "drizzle-orm/node-postgres"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseConfigurationError"
  }
}

type DominoDatabase = NodePgDatabase<typeof schema>

declare global {
  var __dominoPool: Pool | undefined
  var __dominoDb: DominoDatabase | undefined
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL is not set. Copy .env.example to .env and start PostgreSQL with docker compose.",
    )
  }

  return url
}

function getPool() {
  if (!globalThis.__dominoPool) {
    globalThis.__dominoPool = new Pool({
      connectionString: getDatabaseUrl(),
    })
  }

  return globalThis.__dominoPool
}

export function getDb() {
  if (!globalThis.__dominoDb) {
    globalThis.__dominoDb = drizzle(getPool(), { schema })
  }

  return globalThis.__dominoDb
}
