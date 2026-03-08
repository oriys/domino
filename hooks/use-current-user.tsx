"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

import { hasPermission, type User, type UserRole } from "@/lib/api-platform/types"

interface UserContextValue {
  user: User | null
  users: User[]
  isLoading: boolean
  switchUser: (userId: string) => void
  can: (permission: keyof ReturnType<typeof getPermissions>) => boolean
}

function getPermissions(role: UserRole) {
  return {
    canCreate: hasPermission(role, "canCreate"),
    canEdit: hasPermission(role, "canEdit"),
    canPublish: hasPermission(role, "canPublish"),
    canDelete: hasPermission(role, "canDelete"),
    canManageUsers: hasPermission(role, "canManageUsers"),
  }
}

const STORAGE_KEY = "domino-current-user-id"

const UserContext = createContext<UserContextValue>({
  user: null,
  users: [],
  isLoading: true,
  switchUser: () => {},
  can: () => false,
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error("Failed to load users")
        const data = (await res.json()) as User[]
        setUsers(data)

        const savedId = localStorage.getItem(STORAGE_KEY)
        const savedUser = savedId ? data.find((u) => u.id === savedId) : null
        const nextUser = savedUser ?? data[0] ?? null
        setUser(nextUser)
        if (nextUser && nextUser.id !== savedId) {
          localStorage.setItem(STORAGE_KEY, nextUser.id)
        }
      } catch {
        // Gracefully handle — will show loading or empty state
      } finally {
        setIsLoading(false)
      }
    }
    void loadUsers()
  }, [])

  const switchUser = useCallback(
    (userId: string) => {
      const found = users.find((u) => u.id === userId)
      if (found) {
        setUser(found)
        localStorage.setItem(STORAGE_KEY, userId)
      }
    },
    [users],
  )

  const can = useCallback(
    (permission: keyof ReturnType<typeof getPermissions>) => {
      if (!user) return false
      return getPermissions(user.role)[permission]
    },
    [user],
  )

  return (
    <UserContext.Provider value={{ user, users, isLoading, switchUser, can }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(UserContext)
}
