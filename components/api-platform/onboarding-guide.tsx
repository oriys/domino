"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Eye,
  Rocket,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingGuideProps {
  isActive: boolean
  currentStep: number
  onNext: () => void
  onPrev: () => void
  onComplete: () => void
  onSkip: () => void
}

type Placement = "center" | "right" | "bottom" | "bottom-start" | "top" | "left"

interface TourStep {
  id: string
  target?: string
  title: string
  description: string
  tip?: string
  placement: Placement
  highlightPadding?: number
}

// ─── Tour Steps ──────────────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Domino Docs",
    description:
      "Your central workspace for organizing doc spaces, shaping structured reference pages, and publishing them as a coherent portal.",
    tip: "You can replay this guide anytime from the help button in the header.",
    placement: "center",
  },
  {
    id: "sidebar",
    target: "[data-tour='sidebar-nav']",
    title: "Sidebar Navigation",
    description:
      "Documents is the main workspace. Use the rest of the navigation for shared content, glossary, audit history, and workspace settings.",
    placement: "right",
  },
  {
    id: "docs-toolbar",
    target: "[data-tour='docs-toolbar']",
    title: "Document Workspace",
    description:
      "Create collections and doc spaces here, then shape the published hierarchy from categories and pages.",
    placement: "bottom",
    highlightPadding: 12,
  },
  {
    id: "docs-tree",
    target: "[data-tour='docs-tree']",
    title: "Document Tree",
    description:
      "Expand doc spaces and categories to manage pages, open the visual editor, publish drafts, and preview the final portal structure.",
    placement: "top",
  },
  {
    id: "search",
    target: "[data-tour='search']",
    title: "Quick Search",
    description:
      "Search jumps across documentation content so you can open doc spaces, categories, and pages directly from anywhere in the workspace.",
    placement: "bottom",
  },
  {
    id: "complete",
    title: "You are all set",
    description:
      "Start in Documents, shape the hierarchy, then open a page to edit the content that powers the published experience.",
    placement: "center",
  },
]

// ─── Geometry Helpers ────────────────────────────────────────────────────────

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function getTargetRect(selector: string, padding = 8): Rect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    top: r.top - padding,
    left: r.left - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  }
}

function computeTooltipStyle(
  rect: Rect | null,
  placement: Placement,
): React.CSSProperties {
  if (!rect || placement === "center") {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }
  }

  const gap = 16
  const style: React.CSSProperties = { position: "fixed" }

  switch (placement) {
    case "right":
      style.top = rect.top
      style.left = rect.left + rect.width + gap
      break
    case "left":
      style.top = rect.top
      style.right = window.innerWidth - rect.left + gap
      break
    case "bottom":
      style.top = rect.top + rect.height + gap
      style.left = rect.left + rect.width / 2
      style.transform = "translateX(-50%)"
      break
    case "bottom-start":
      style.top = rect.top + rect.height + gap
      style.right = window.innerWidth - rect.left - rect.width
      break
    case "top":
      style.bottom = window.innerHeight - rect.top + gap
      style.left = rect.left + rect.width / 2
      style.transform = "translateX(-50%)"
      break
  }

  return style
}

// ─── Reduced motion helper ──────────────────────────────────────────────────

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return prefersReduced
}

// ─── Feature Cards (Welcome step) ───────────────────────────────────────────

function WelcomeFeatures() {
  const features = [
    {
      icon: <Edit3 className="h-5 w-5 text-chart-1" />,
      title: "Design",
      desc: "Shape doc spaces, categories, and structured pages",
    },
    {
      icon: <Eye className="h-5 w-5 text-chart-2" />,
      title: "Preview",
      desc: "Preview the published documentation portal",
    },
    {
      icon: <Rocket className="h-5 w-5 text-chart-4" />,
      title: "Publish",
      desc: "Ship documentation updates",
    },
  ]

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/50 p-3 text-center"
        >
          {f.icon}
          <span className="text-xs font-medium text-foreground">{f.title}</span>
          <span className="text-[11px] leading-tight text-muted-foreground">{f.desc}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardingGuide({
  isActive,
  currentStep,
  onNext,
  onPrev,
  onComplete,
  onSkip,
}: OnboardingGuideProps) {
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1
  const isCentered = step?.placement === "center"
  const totalSteps = TOUR_STEPS.length

  const updateSpotlight = useCallback(() => {
    if (!step?.target) {
      setSpotlightRect(null)
      return
    }
    setSpotlightRect(getTargetRect(step.target, step.highlightPadding ?? 8))
  }, [step])

  // Re-calculate spotlight on resize / scroll
  useEffect(() => {
    if (!isActive) return

    const raf = requestAnimationFrame(updateSpotlight)
    window.addEventListener("resize", updateSpotlight)
    window.addEventListener("scroll", updateSpotlight, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", updateSpotlight)
      window.removeEventListener("scroll", updateSpotlight, true)
    }
  }, [isActive, updateSpotlight])

  // Scroll target into view
  useEffect(() => {
    if (!isActive || !step?.target) return
    const el = document.querySelector(step.target)
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [isActive, step])

  // Focus trap: capture previous focus, auto-focus tooltip, restore on close
  useEffect(() => {
    if (!isActive) return

    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Set all content behind the tour as inert
    const mainContent = document.getElementById("main-content")
    if (mainContent) mainContent.setAttribute("inert", "")

    return () => {
      if (mainContent) mainContent.removeAttribute("inert")
    }
  }, [isActive])

  // Auto-focus the primary action button on each step change
  useEffect(() => {
    if (!isActive || !tooltipRef.current) return
    const raf = requestAnimationFrame(() => {
      const btn = tooltipRef.current?.querySelector<HTMLButtonElement>("[data-tour-primary]")
      btn?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [isActive, currentStep])

  // Restore focus when tour closes
  useEffect(() => {
    if (isActive) return
    // Tour just became inactive — restore focus
    previousFocusRef.current?.focus()
  }, [isActive])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onSkip()
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault()
        isLast ? onComplete() : onNext()
      }
      if (e.key === "ArrowLeft" && !isFirst) {
        e.preventDefault()
        onPrev()
      }
      // Trap Tab within the tooltip
      if (e.key === "Tab" && tooltipRef.current) {
        const focusable = tooltipRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, isFirst, isLast, onNext, onPrev, onComplete, onSkip])

  if (!isActive || !step) return null

  const tooltipStyle = computeTooltipStyle(spotlightRect, step.placement)
  const motionTransition = prefersReducedMotion ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s ease"

  // Compute spotlight styles using transform (GPU-composited) instead of top/left/width/height
  const spotlightStyle: React.CSSProperties | undefined = spotlightRect
    ? {
        position: "fixed",
        zIndex: 9998,
        top: 0,
        left: 0,
        width: spotlightRect.width,
        height: spotlightRect.height,
        borderRadius: 8,
        boxShadow: "0 0 0 9999px oklch(0.15 0.01 262 / 0.5), 0 0 8px 2px oklch(0.15 0.01 262 / 0.3)",
        pointerEvents: "none",
        transform: `translate(${spotlightRect.left}px, ${spotlightRect.top}px)`,
        transition: motionTransition,
      }
    : undefined

  return (
    <div role="dialog" aria-modal="true" aria-label="Onboarding tour">
      {/* Click catcher behind everything */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Overlay / Spotlight */}
      {isCentered || !spotlightRect ? (
        <div className="fixed inset-0 z-[9998] bg-foreground/50" />
      ) : (
        <div className="tour-spotlight" style={spotlightStyle} />
      )}

      {/* Tooltip Card */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[10000] w-[380px] rounded-xl border border-border bg-card p-5 shadow-2xl",
          !prefersReducedMotion && "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        style={tooltipStyle}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onSkip}
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-6">
          {/* Step indicator dots */}
          <div className="mb-3 flex items-center gap-1.5" role="group" aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full",
                  !prefersReducedMotion && "transition-all duration-300",
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20",
                )}
                aria-hidden="true"
              />
            ))}
          </div>

          <h2 className="mb-1.5 text-base font-semibold text-foreground">
            {step.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {step.tip && (
            <p className="mt-2 text-xs italic text-muted-foreground/70">
              {step.tip}
            </p>
          )}

          {/* Feature cards on welcome step */}
          {step.id === "welcome" && <WelcomeFeatures />}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            {!isFirst && !isCentered && (
              <Button variant="ghost" size="sm" onClick={onPrev} className="gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLast && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLast ? onComplete : onNext}
              className="gap-1.5"
              data-tour-primary
            >
              {isFirst ? "Start Tour" : isLast ? "Get Started" : "Next"}
              {isLast ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Step counter */}
        <p className="mt-3 text-center text-[11px] text-muted-foreground/50">
          {currentStep + 1} / {totalSteps}
        </p>
      </div>
    </div>
  )
}
