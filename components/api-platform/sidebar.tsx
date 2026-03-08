"use client"

import {
  BookOpen,
  BookText,
  ChevronLeft,
  ChevronRight,
  LibraryBig,
  ScrollText,
  Settings,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type ViewMode } from "@/lib/api-platform/types"
import { cn } from "@/lib/utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate: (view: ViewMode) => void
  currentView: ViewMode
}

const navItems: { icon: LucideIcon; label: string; view: ViewMode }[] = [
  { icon: BookOpen, label: "Documents", view: "docs-manage" },
  { icon: LibraryBig, label: "Content Library", view: "content-library" },
  { icon: BookText, label: "Glossary", view: "glossary" },
  { icon: ScrollText, label: "Audit Log", view: "audit-log" },
  { icon: Settings, label: "Settings", view: "settings" },
]

export function Sidebar({ collapsed, onToggle, onNavigate, currentView }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex flex-col border-r border-border bg-sidebar", collapsed ? "w-16" : "w-64")}>
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-sidebar-foreground">Domino Docs</span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Zap className="h-4 w-4 text-background" />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav data-tour="sidebar-nav" className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const isActive =
                item.view === currentView ||
                (item.view === "docs-manage" && (currentView === "doc-editor" || currentView === "doc-portal"))

              return collapsed ? (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className={cn("relative mx-auto h-10 w-10", isActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
                      onClick={() => onNavigate(item.view)}
                    >
                      <item.icon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("h-10 justify-start gap-3", isActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
                  onClick={() => onNavigate(item.view)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-2">
          <Button variant="ghost" size="icon" className="mx-auto flex h-10 w-10" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
