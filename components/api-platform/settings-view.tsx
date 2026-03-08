"use client"

import { RefreshCcw, Settings } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

interface SettingsViewProps {
  isRefreshing: boolean
  onRefresh: () => Promise<void>
  onSidebarCollapsedChange: (collapsed: boolean) => void
  sidebarCollapsed: boolean
}

export function SettingsView({
  isRefreshing,
  onRefresh,
  onSidebarCollapsedChange,
  sidebarCollapsed,
}: SettingsViewProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Manage workspace preferences for the documentation platform.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Workspace preferences</CardTitle>
            <CardDescription>These controls affect how the current workspace behaves in the browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Compact sidebar</p>
                <p className="text-sm text-muted-foreground">
                  Collapse the primary navigation into an icon-only rail.
                </p>
              </div>
              <Switch
                checked={sidebarCollapsed}
                onCheckedChange={onSidebarCollapsedChange}
                aria-label="Toggle compact sidebar"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Switch between the light and dark design tokens used across the app.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Workspace actions</CardTitle>
            <CardDescription>Common maintenance actions for the current documentation workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <Button onClick={() => void onRefresh()} disabled={isRefreshing} className="w-full gap-2">
              <RefreshCcw className="h-4 w-4" />
              {isRefreshing ? "Refreshing document workspace..." : "Refresh document workspace"}
            </Button>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Refresh reloads the latest document tree, glossary, and content library data from the backend.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Runtime configuration</CardTitle>
          <CardDescription>The platform features currently wired into this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-foreground">Application shell</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Next.js App Router with a document-first workspace shell.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="font-medium text-foreground">Persistence</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Doc spaces, pages, glossary terms, and shared content are backed by PostgreSQL through Drizzle.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="font-medium text-foreground">Publishing model</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Draft and published states are managed directly at the documentation page level.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="font-medium text-foreground">Reusable content</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Snippets and example sets are shared directly across docs instead of being tied to a separate API entity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
