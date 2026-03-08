import { eq } from "drizzle-orm"

import type { User } from "@/lib/api-platform/types"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

type UserRow = typeof users.$inferSelect

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  }
}

const DEFAULT_USERS: { name: string; email: string; role: User["role"]; avatarUrl: string | null }[] = [
  { name: "Alice Chen", email: "alice@domino.dev", role: "admin", avatarUrl: null },
  { name: "Bob Park", email: "bob@domino.dev", role: "publisher", avatarUrl: null },
  { name: "Carol Liu", email: "carol@domino.dev", role: "author", avatarUrl: null },
  { name: "Dave Kim", email: "dave@domino.dev", role: "author", avatarUrl: null },
]

async function ensureDefaultUsers(): Promise<void> {
  const db = getDb()
  const existing = await db.select({ id: users.id }).from(users).limit(1)
  if (existing.length > 0) return

  for (const u of DEFAULT_USERS) {
    await db.insert(users).values(u).onConflictDoNothing()
  }
}

export async function listUsers(): Promise<User[]> {
  await ensureDefaultUsers()
  const rows = await getDb().select().from(users)
  return rows.map(toUser)
}

export async function getUserById(id: string): Promise<User | null> {
  const [row] = await getDb().select().from(users).where(eq(users.id, id))
  return row ? toUser(row) : null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [row] = await getDb().select().from(users).where(eq(users.email, email))
  return row ? toUser(row) : null
}
