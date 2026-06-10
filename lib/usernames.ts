import { neon } from "@neondatabase/serverless"
import { clerkClient } from "@clerk/nextjs/server"

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

// Best-effort mirror of our username into Clerk's native username field, so the
// two systems stay in sync. Never throws — Clerk remains a secondary store.
async function syncUsernameToClerk(userId: string, username: string): Promise<void> {
  try {
    const client = await clerkClient()
    await client.users.updateUser(userId, { username })
  } catch (err) {
    // Clerk may reject (e.g. already taken on its side, or feature mismatch).
    // We log and continue — our DB is the source of truth.
    console.error("[v0] Failed to sync username to Clerk:", err)
  }
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
// `clerkUsername` (when Clerk's native usernames are enabled) is preferred as
// the base slug, falling back to a slug derived from the display name.
export async function ensureUsername(
  userId: string,
  displayName?: string,
  clerkUsername?: string | null,
): Promise<string | null> {
  if (!userId) return null
  const sql = getDb()

  const existing = await sql`SELECT username FROM usernames WHERE user_id = ${userId} LIMIT 1`
  if (existing.length > 0) return existing[0].username as string

  // Prefer Clerk's username as the seed when it exists and is usable
  const preferred = clerkUsername ? slugifyName(clerkUsername) : ""
  const base = preferred && isValidUsername(preferred) ? preferred : slugifyName(displayName || "user")
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

const CHANGE_LIMIT = 2
const CHANGE_WINDOW_DAYS = 14

// Returns how many username changes the user has made in the last 14 days
// and when the window resets (oldest change timestamp + 14 days).
export async function getUsernameChangeInfo(userId: string): Promise<{
  changesInWindow: number
  remaining: number
  resetsAt: Date | null
}> {
  const sql = getDb()
  const rows = await sql`
    SELECT username_change_count, username_last_changed_at
    FROM usernames WHERE user_id = ${userId} LIMIT 1
  `
  if (rows.length === 0) return { changesInWindow: 0, remaining: CHANGE_LIMIT, resetsAt: null }

  const lastChanged: Date | null = rows[0].username_last_changed_at
    ? new Date(rows[0].username_last_changed_at as string)
    : null

  const windowStart = new Date(Date.now() - CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const inWindow = lastChanged && lastChanged > windowStart ? (rows[0].username_change_count as number) : 0
  const remaining = Math.max(0, CHANGE_LIMIT - inWindow)
  const resetsAt = lastChanged && inWindow > 0
    ? new Date(lastChanged.getTime() + CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    : null

  return { changesInWindow: inWindow, remaining, resetsAt }
}

// Check if a username is available (case-insensitive) for a given user.
export async function isUsernameAvailable(username: string, ignoreUserId: string): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT user_id FROM usernames WHERE LOWER(username) = LOWER(${username}) AND user_id != ${ignoreUserId} LIMIT 1
  `
  return rows.length === 0
}

// Change a user's username to a custom value. Throws on invalid/taken/limit exceeded.
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

  // Enforce rate limit: max 2 changes per 14-day rolling window
  const { remaining } = await getUsernameChangeInfo(userId)
  if (remaining <= 0) {
    throw new Error("RATE_LIMITED")
  }

  await sql`
    INSERT INTO usernames (user_id, username, is_custom, updated_at, username_change_count, username_last_changed_at)
    VALUES (${userId}, ${normalized}, TRUE, NOW(), 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      username = ${normalized},
      is_custom = TRUE,
      updated_at = NOW(),
      username_change_count = CASE
        WHEN usernames.username_last_changed_at > NOW() - INTERVAL '14 days'
        THEN usernames.username_change_count + 1
        ELSE 1
      END,
      username_last_changed_at = NOW()
  `

  // Keep Clerk's native username in sync (best-effort, never blocks).
  await syncUsernameToClerk(userId, normalized)
}
