import { neon } from "@neondatabase/serverless"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// Turn a display name into a URL-safe base slug
export function slugifyName(name: string): string {
  const base = (name || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric -> hyphen
    .replace(/^-+|-+$/g, "") // trim hyphens
    .slice(0, 30)
    .replace(/-+$/g, "")
  return base || "user"
}

// Reserved words that cannot be used as a username
const RESERVED = new Set([
  "admin",
  "api",
  "profile",
  "settings",
  "about",
  "login",
  "signin",
  "signup",
  "user",
  "users",
  "me",
  "null",
  "undefined",
])

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(username) && !RESERVED.has(username)
}

// Find a unique username derived from base, appending a numeric suffix if taken.
// Optionally ignore a specific user_id (so a user keeps their own row).
async function findAvailableUsername(base: string, ignoreUserId?: string): Promise<string> {
  const sql = getDb()
  let candidate = base
  let attempt = 0
  // Try base, then base-2, base-3, ... up to a reasonable limit, then random suffix
  while (true) {
    const rows = await sql`
      SELECT user_id FROM usernames WHERE LOWER(username) = LOWER(${candidate}) LIMIT 1
    `
    if (rows.length === 0 || (ignoreUserId && rows[0].user_id === ignoreUserId)) {
      return candidate
    }
    attempt += 1
    if (attempt > 50) {
      candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`
    } else {
      candidate = `${base}-${attempt + 1}`
    }
  }
}

// Ensure a username row exists for the given user. Returns the username.
// If the user already has one, it is returned unchanged.
export async function ensureUsername(userId: string, displayName?: string): Promise<string | null> {
  if (!userId) return null
  const sql = getDb()

  const existing = await sql`SELECT username FROM usernames WHERE user_id = ${userId} LIMIT 1`
  if (existing.length > 0) return existing[0].username as string

  const base = slugifyName(displayName || "user")
  const username = await findAvailableUsername(base, userId)

  await sql`
    INSERT INTO usernames (user_id, username, display_name, is_custom)
    VALUES (${userId}, ${username}, ${displayName || null}, FALSE)
    ON CONFLICT (user_id) DO NOTHING
  `
  const row = await sql`SELECT username FROM usernames WHERE user_id = ${userId} LIMIT 1`
  return row.length > 0 ? (row[0].username as string) : username
}

// Resolve an identifier (either a clean username or a raw Clerk user_id) to a user_id.
export async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null
  const sql = getDb()

  // Raw Clerk IDs start with "user_"
  if (identifier.startsWith("user_")) {
    return identifier
  }

  const rows = await sql`
    SELECT user_id FROM usernames WHERE LOWER(username) = LOWER(${identifier}) LIMIT 1
  `
  return rows.length > 0 ? (rows[0].user_id as string) : null
}

// Get the username for a user_id, if one exists.
export async function getUsername(userId: string): Promise<string | null> {
  if (!userId) return null
  const sql = getDb()
  const rows = await sql`SELECT username FROM usernames WHERE user_id = ${userId} LIMIT 1`
  return rows.length > 0 ? (rows[0].username as string) : null
}

// Change a user's username to a custom value. Throws on invalid/taken.
export async function setUsername(userId: string, newUsername: string): Promise<void> {
  const sql = getDb()
  const normalized = newUsername.toLowerCase().trim()

  if (!isValidUsername(normalized)) {
    throw new Error("INVALID")
  }

  const taken = await sql`
    SELECT user_id FROM usernames WHERE LOWER(username) = LOWER(${normalized}) AND user_id != ${userId} LIMIT 1
  `
  if (taken.length > 0) {
    throw new Error("TAKEN")
  }

  await sql`
    INSERT INTO usernames (user_id, username, is_custom, updated_at)
    VALUES (${userId}, ${normalized}, TRUE, NOW())
    ON CONFLICT (user_id) DO UPDATE SET username = ${normalized}, is_custom = TRUE, updated_at = NOW()
  `
}
