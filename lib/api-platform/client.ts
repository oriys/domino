const USER_STORAGE_KEY = "domino-current-user-id"

/** Returns an X-User-Id header sourced from localStorage (client-side only). */
export function getUserHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const userId = localStorage.getItem(USER_STORAGE_KEY)
  return userId ? { "X-User-Id": userId } : {}
}
