export type BlockPreset = "default" | "soft" | "outline" | "emphasis"
export type BlockTone = "neutral" | "brand" | "success" | "warning" | "danger"
export type BlockDensity = "compact" | "comfortable" | "spacious"

export interface BlockAppearance {
  preset: BlockPreset
  tone: BlockTone
  density: BlockDensity
}

export const defaultBlockAppearance: BlockAppearance = {
  preset: "default",
  tone: "neutral",
  density: "comfortable",
}

export const blockPresetLabels: Record<BlockPreset, string> = {
  default: "默认",
  soft: "柔和",
  outline: "线框",
  emphasis: "强调",
}

export const blockToneLabels: Record<BlockTone, string> = {
  neutral: "中性",
  brand: "品牌",
  success: "成功",
  warning: "警示",
  danger: "危险",
}

export const blockDensityLabels: Record<BlockDensity, string> = {
  compact: "紧凑",
  comfortable: "舒适",
  spacious: "宽松",
}

function joinClasses(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ")
}

export function normalizeBlockAppearance(
  appearance?: Partial<BlockAppearance> | null,
): BlockAppearance {
  return {
    preset: appearance?.preset ?? defaultBlockAppearance.preset,
    tone: appearance?.tone ?? defaultBlockAppearance.tone,
    density: appearance?.density ?? defaultBlockAppearance.density,
  }
}

export function isDefaultBlockAppearance(
  appearance?: Partial<BlockAppearance> | null,
): boolean {
  const normalized = normalizeBlockAppearance(appearance)
  return (
    normalized.preset === defaultBlockAppearance.preset &&
    normalized.tone === defaultBlockAppearance.tone &&
    normalized.density === defaultBlockAppearance.density
  )
}

export interface BlockAppearanceClasses {
  shell: string
  header: string
  body: string
  badge: string
  icon: string
  accent: string
  inlineCard: string
  code: string
  tableHead: string
  tableCell: string
}

export function getBlockAppearanceClasses(
  appearance?: Partial<BlockAppearance> | null,
): BlockAppearanceClasses {
  const normalized = normalizeBlockAppearance(appearance)

  const tone = {
    neutral: {
      shell: "border-border/70",
      header: "bg-muted/40 text-foreground",
      badge: "border-border bg-muted text-muted-foreground",
      icon: "text-muted-foreground",
      accent: "text-foreground",
      inlineCard: "border-border/60 bg-background",
      code: "border-border/60 bg-muted/20",
      tableHead: "bg-muted/50 text-foreground",
      tableCell: "border-border/60",
    },
    brand: {
      shell: "border-primary/25",
      header: "bg-primary/10 text-primary",
      badge: "border-primary/20 bg-primary/10 text-primary",
      icon: "text-primary",
      accent: "text-primary",
      inlineCard: "border-primary/15 bg-primary/[0.035]",
      code: "border-primary/15 bg-primary/[0.04]",
      tableHead: "bg-primary/[0.08] text-primary",
      tableCell: "border-primary/15",
    },
    success: {
      shell: "border-success/25",
      header: "bg-success/10 text-success",
      badge: "border-success/20 bg-success/10 text-success",
      icon: "text-success",
      accent: "text-success",
      inlineCard: "border-success/15 bg-success/[0.04]",
      code: "border-success/15 bg-success/[0.045]",
      tableHead: "bg-success/[0.1] text-success",
      tableCell: "border-success/15",
    },
    warning: {
      shell: "border-warning/25",
      header: "bg-warning/10 text-warning",
      badge: "border-warning/20 bg-warning/10 text-warning",
      icon: "text-warning",
      accent: "text-warning",
      inlineCard: "border-warning/15 bg-warning/[0.05]",
      code: "border-warning/15 bg-warning/[0.055]",
      tableHead: "bg-warning/[0.11] text-warning",
      tableCell: "border-warning/15",
    },
    danger: {
      shell: "border-destructive/25",
      header: "bg-destructive/10 text-destructive",
      badge: "border-destructive/20 bg-destructive/10 text-destructive",
      icon: "text-destructive",
      accent: "text-destructive",
      inlineCard: "border-destructive/15 bg-destructive/[0.04]",
      code: "border-destructive/15 bg-destructive/[0.045]",
      tableHead: "bg-destructive/[0.08] text-destructive",
      tableCell: "border-destructive/15",
    },
  }[normalized.tone]

  const preset = {
    default: {
      shell: "bg-card shadow-sm",
      header: "border-b",
      inlineCard: "",
    },
    soft: {
      shell: "bg-background/90 shadow-none",
      header: "border-b/0",
      inlineCard: "shadow-none",
    },
    outline: {
      shell: "bg-background border-dashed shadow-none",
      header: "border-b border-dashed",
      inlineCard: "border-dashed",
    },
    emphasis: {
      shell: "bg-card shadow-md shadow-black/[0.03]",
      header: "border-b",
      inlineCard: "shadow-sm",
    },
  }[normalized.preset]

  const density = {
    compact: {
      header: "px-4 py-2.5",
      body: "p-4 space-y-3",
    },
    comfortable: {
      header: "px-5 py-3.5",
      body: "p-5 space-y-4",
    },
    spacious: {
      header: "px-6 py-4",
      body: "p-6 space-y-5",
    },
  }[normalized.density]

  return {
    shell: joinClasses("overflow-hidden rounded-xl border", tone.shell, preset.shell),
    header: joinClasses("flex items-center gap-3", tone.header, preset.header, density.header),
    body: density.body,
    badge: joinClasses("border text-[11px] font-medium", tone.badge),
    icon: joinClasses("h-4 w-4", tone.icon),
    accent: tone.accent,
    inlineCard: joinClasses("rounded-lg border p-4", tone.inlineCard, preset.inlineCard),
    code: joinClasses("overflow-hidden rounded-lg border", tone.code),
    tableHead: tone.tableHead,
    tableCell: tone.tableCell,
  }
}
