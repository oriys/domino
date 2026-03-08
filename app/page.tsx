"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

import { AuditLogView } from "@/components/api-platform/audit-log-view"
import { ContentLibraryView } from "@/components/api-platform/content-library-view"
import { DocEditor } from "@/components/api-platform/doc-editor"
import { DocPortal } from "@/components/api-platform/doc-portal"
import { DocsManageView } from "@/components/api-platform/docs-manage-view"
import { GlossaryView } from "@/components/api-platform/glossary-view"
import { Header } from "@/components/api-platform/header"
import { OnboardingGuide } from "@/components/api-platform/onboarding-guide"
import { SettingsView } from "@/components/api-platform/settings-view"
import { Sidebar } from "@/components/api-platform/sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserProvider } from "@/hooks/use-current-user"
import { useOnboarding } from "@/hooks/use-onboarding"
import type { SearchResult } from "@/lib/api-platform/docs-client"
import { viewModes, type ViewMode } from "@/lib/api-platform/types"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error while talking to the backend."
}

export default function ApiPlatformPage() {
  return (
    <UserProvider>
      <ApiPlatform />
    </UserProvider>
  )
}

function getInitialStateFromUrl(): {
  viewMode: ViewMode
  editingDocPageId: string | null
  previewProductId: string | null
} {
  if (typeof window === "undefined") {
    return { viewMode: "docs-manage", editingDocPageId: null, previewProductId: null }
  }
  const params = new URLSearchParams(window.location.search)
  const docId = params.get("doc")
  const portalId = params.get("portal")
  const view = params.get("view")

  if (docId) {
    return { viewMode: "doc-editor", editingDocPageId: docId, previewProductId: null }
  }
  if (portalId) {
    return { viewMode: "doc-portal", editingDocPageId: null, previewProductId: portalId }
  }
  if (view && viewModes.includes(view as ViewMode)) {
    return { viewMode: view as ViewMode, editingDocPageId: null, previewProductId: null }
  }
  return { viewMode: "docs-manage", editingDocPageId: null, previewProductId: null }
}

const defaultNavigationState = {
  viewMode: "docs-manage" as ViewMode,
  editingDocPageId: null as string | null,
  previewProductId: null as string | null,
}

function syncUrlParams(viewMode: ViewMode, docId: string | null, portalId: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete("doc")
  url.searchParams.delete("portal")
  url.searchParams.delete("view")

  if (docId) {
    url.searchParams.set("doc", docId)
  } else if (portalId) {
    url.searchParams.set("portal", portalId)
  } else if (viewMode !== "docs-manage") {
    url.searchParams.set("view", viewMode)
  }

  window.history.replaceState({}, "", url.toString())
}

function ApiPlatform() {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultNavigationState.viewMode)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingDocPageId, setEditingDocPageId] = useState<string | null>(defaultNavigationState.editingDocPageId)
  const [previewProductId, setPreviewProductId] = useState<string | null>(defaultNavigationState.previewProductId)
  const [refreshKey, setRefreshKey] = useState(0)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [navigationReady, setNavigationReady] = useState(false)

  const onboarding = useOnboarding()

  function navigateToDocumentsHome() {
    setViewMode("docs-manage")
    setEditingDocPageId(null)
    setPreviewProductId(null)
    setErrorMessage(null)
  }

  useEffect(() => {
    const state = getInitialStateFromUrl()
    setViewMode(state.viewMode)
    setEditingDocPageId(state.editingDocPageId)
    setPreviewProductId(state.previewProductId)
    setNavigationReady(true)
  }, [])

  // Sync URL params whenever navigation state changes
  useEffect(() => {
    if (!navigationReady) return
    syncUrlParams(viewMode, editingDocPageId, previewProductId)
  }, [navigationReady, viewMode, editingDocPageId, previewProductId])

  // Handle browser back/forward
  useEffect(() => {
    if (!navigationReady) return

    function handlePopState() {
      const state = getInitialStateFromUrl()
      setViewMode(state.viewMode)
      setEditingDocPageId(state.editingDocPageId)
      setPreviewProductId(state.previewProductId)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [navigationReady])

  async function refreshWorkspace() {
    setIsRefreshing(true)
    try {
      setRefreshKey((current) => current + 1)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsRefreshing(false)
    }
  }

  function handleSidebarNavigate(nextView: ViewMode) {
    setViewMode(nextView)

    if (nextView !== "doc-editor" && nextView !== "doc-portal") {
      setEditingDocPageId(null)
      setPreviewProductId(null)
    }

    setErrorMessage(null)
  }

  function handleSearchResultClick(result: SearchResult) {
    if (result.type === "doc_page") {
      setEditingDocPageId(result.id)
      setViewMode("doc-editor")
    } else if (result.type === "product" && result.id) {
      setPreviewProductId(result.id)
      setViewMode("doc-portal")
    } else if (result.type === "category") {
      setViewMode("docs-manage")
    }

    setSearchQuery("")
  }

  useEffect(() => {
    setBootstrapped(true)
  }, [])

  useEffect(() => {
    if (!bootstrapped || !onboarding.shouldAutoStart) {
      return
    }

    const timer = setTimeout(() => onboarding.start(), 600)
    return () => clearTimeout(timer)
  }, [bootstrapped, onboarding])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={handleSidebarNavigate}
        currentView={viewMode}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          viewMode={viewMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onBack={navigateToDocumentsHome}
          onSearchResultClick={handleSearchResultClick}
          onStartTour={() => {
            if (viewMode !== "docs-manage" || editingDocPageId || previewProductId) {
              navigateToDocumentsHome()
            }
            onboarding.restart()
          }}
        />
        <main id="main-content" className="flex-1 overflow-auto">
          {errorMessage ? (
            <div className="p-6 pb-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Backend request failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          {viewMode === "content-library" && <ContentLibraryView key={`library-${refreshKey}`} />}
          {viewMode === "settings" && (
            <SettingsView
              isRefreshing={isRefreshing}
              onRefresh={refreshWorkspace}
              onSidebarCollapsedChange={(collapsed) => setSidebarCollapsed(collapsed)}
              sidebarCollapsed={sidebarCollapsed}
            />
          )}
          {viewMode === "docs-manage" && (
            <DocsManageView
              key={`docs-${refreshKey}`}
              onEditPage={(page) => {
                setEditingDocPageId(page.id)
                setViewMode("doc-editor")
              }}
              onPreviewProduct={(productId) => {
                setPreviewProductId(productId)
                setViewMode("doc-portal")
              }}
            />
          )}
          {viewMode === "doc-editor" && editingDocPageId && (
            <DocEditor
              key={editingDocPageId}
              pageId={editingDocPageId}
              onBack={() => {
                setEditingDocPageId(null)
                setViewMode("docs-manage")
              }}
            />
          )}
          {viewMode === "doc-portal" && previewProductId && (
            <DocPortal
              key={previewProductId}
              productId={previewProductId}
              onBack={() => {
                setPreviewProductId(null)
                setViewMode("docs-manage")
              }}
            />
          )}
          {viewMode === "audit-log" && <AuditLogView key={`audit-${refreshKey}`} />}
          {viewMode === "glossary" && <GlossaryView key={`glossary-${refreshKey}`} />}
        </main>
      </div>

      <OnboardingGuide
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onComplete={onboarding.complete}
        onSkip={onboarding.skip}
      />
    </div>
  )
}
