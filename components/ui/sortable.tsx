"use client"

import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Re-exports for convenience ──────────────────────────────────────────────

export {
  DndContext,
  DragOverlay,
  SortableContext,
  closestCenter,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
}

// ─── Drag Handle Context ─────────────────────────────────────────────────────

const DragHandleContext = createContext<{
  attributes: DraggableAttributes
  listeners: Record<string, unknown> | undefined
}>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
})

export function useDragHandle() {
  return useContext(DragHandleContext)
}

// ─── DragHandle Component ────────────────────────────────────────────────────

export function DragHandle({ className }: { className?: string }) {
  const { attributes, listeners } = useDragHandle()
  return (
    <button
      type="button"
      className={cn(
        "flex shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/50 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}

// ─── SortableItem ────────────────────────────────────────────────────────────

interface SortableItemProps {
  id: UniqueIdentifier
  className?: string
  asChild?: boolean
}

export function SortableItem({
  id,
  className,
  children,
}: PropsWithChildren<SortableItemProps>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const ctx = useMemo(
    () => ({ attributes, listeners }),
    [attributes, listeners],
  )

  return (
    <DragHandleContext.Provider value={ctx}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          isDragging && "relative z-10 opacity-50",
          className,
        )}
      >
        {children}
      </div>
    </DragHandleContext.Provider>
  )
}

// ─── Sortable List (batteries-included wrapper) ──────────────────────────────

interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (reorderedItems: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  renderOverlay?: (activeItem: T) => React.ReactNode
  className?: string
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  className,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [items, activeId],
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(arrayMove(items, oldIndex, newIndex))
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => renderItem(item, index))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem && renderOverlay
          ? renderOverlay(activeItem)
          : null}
      </DragOverlay>
    </DndContext>
  )
}
