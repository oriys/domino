"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Bell, BookOpen, Check, ChevronDown, File, FolderOpen, HelpCircle, LogOut, Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCurrentUser } from "@/hooks/use-current-user"
import { searchDocs, type SearchResult } from "@/lib/api-platform/docs-client"
import { isDetailView, type ViewMode } from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

interface HeaderProps {
  viewMode: ViewMode
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onBack: () => void
  onSearchResultClick?: (result: SearchResult) => void
  onStartTour?: () => void
}

function formatSearchResultType(type: SearchResult["type"]) {
  if (type === "product") return "doc space"
  return type.replace("_", " ")
}

export function Header({
  viewMode,
  searchQuery,
  onSearchQueryChange,
  onBack,
  onSearchResultClick,
  onStartTour,
}: HeaderProps) {
  const { user, users, switchUser } = useCurrentUser()
  const detailView = isDetailView(viewMode)
  const showBackButton = detailView && viewMode !== "doc-editor"
  const trimmedSearchQuery = searchQuery.trim()
  const canSearch = trimmedSearchQuery.length >= 2
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canSearch) {
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      try {
        const results = await searchDocs(trimmedSearchQuery)
        if (cancelled) return
        setGlobalResults(results)
        setShowResults(results.length > 0)
      } catch {
        if (cancelled) return
        setGlobalResults([])
        setShowResults(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [canSearch, trimmedSearchQuery])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <>
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10" aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        <div data-tour="search" className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => {
              const nextQuery = event.target.value
              onSearchQueryChange(nextQuery)
              setActiveIndex(-1)

              if (nextQuery.trim().length < 2) {
                setGlobalResults([])
                setShowResults(false)
              }
            }}
            onFocus={() => canSearch && globalResults.length > 0 && setShowResults(true)}
            onKeyDown={(event) => {
              if (!showResults || globalResults.length === 0) return

              if (event.key === "ArrowDown") {
                event.preventDefault()
                setActiveIndex((prev) => (prev + 1) % globalResults.length)
              } else if (event.key === "ArrowUp") {
                event.preventDefault()
                setActiveIndex((prev) => (prev <= 0 ? globalResults.length - 1 : prev - 1))
              } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault()
                onSearchResultClick?.(globalResults[activeIndex])
                setShowResults(false)
                onSearchQueryChange("")
                setActiveIndex(-1)
              } else if (event.key === "Escape") {
                setShowResults(false)
                setActiveIndex(-1)
              }
            }}
            placeholder="Search documentation..."
            className="h-9 w-full border-border bg-input pl-9 sm:w-80"
            aria-label="Search documentation"
            aria-activedescendant={showResults && activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground sm:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>

          {canSearch && showResults && globalResults.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-96 rounded-md border bg-popover shadow-lg">
              <div className="px-3 py-2 text-[10px] font-medium uppercase text-muted-foreground">
                {globalResults.length} result{globalResults.length !== 1 ? "s" : ""} across docs
              </div>
              <div className="max-h-64 overflow-y-auto" role="listbox">
                {globalResults.map((result, index) => {
                  const Icon = result.type === "product" ? BookOpen : result.type === "category" ? FolderOpen : File

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      id={`search-result-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                        activeIndex === index && "bg-accent",
                      )}
                      onClick={() => {
                        onSearchResultClick?.(result)
                        setShowResults(false)
                        onSearchQueryChange("")
                        setActiveIndex(-1)
                      }}
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{result.title}</span>
                          <Badge variant="outline" className="shrink-0 text-[9px]">{formatSearchResultType(result.type)}</Badge>
                          {result.status && (
                            <Badge variant={result.status === "published" ? "default" : "secondary"} className="shrink-0 text-[9px]">
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                          {result.productName && <span>{result.productName} · </span>}
                          {result.snippet}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Help — Replay onboarding tour" onClick={onStartTour}>
          <HelpCircle className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {user?.name.split(" ").map((name) => name[0]).join("").slice(0, 2) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user?.name ?? "Loading…"}</span>
              <Badge variant="outline" className="hidden text-[10px] capitalize sm:inline-flex">{user?.role}</Badge>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch user</DropdownMenuLabel>
            {users.map((nextUser) => (
              <DropdownMenuItem key={nextUser.id} onClick={() => switchUser(nextUser.id)} className="gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-muted text-[10px]">
                    {nextUser.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="text-sm">{nextUser.name}</span>
                  <span className="ml-1.5 text-xs capitalize text-muted-foreground">({nextUser.role})</span>
                </div>
                {nextUser.id === user?.id && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
