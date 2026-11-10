// Adapted from ddoemonn/interior (MIT). See ./LICENSE and ./README.md.
"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
export type DropdownItem = {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

export type UseDropdownOptions = {
  items: DropdownItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  disabled?: boolean
  typeaheadDelay?: number
}

export function useDropdown({
  items,
  value,
  defaultValue,
  onChange,
  disabled = false,
  typeaheadDelay = 600,
}: UseDropdownOptions) {
  const uid = useId()
  const listId = `${uid}-list`
  const itemId = useCallback((i: number) => `${uid}-opt-${i}`, [uid])

  const [uncontrolled, setUncontrolled] = useState<string | null>(
    defaultValue ?? null
  )
  const selectedValue = value !== undefined ? value : uncontrolled
  const selectedIndex = items.findIndex((it) => it.value === selectedValue)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const viaKey = useRef(false)
  const buffer = useRef("")
  const bufferTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const emit = useRef(onChange)
  useEffect(() => {
    emit.current = onChange
  }, [onChange])

  const step = useCallback(
    (from: number, dir: 1 | -1) => {
      const n = items.length
      if (n === 0) return -1
      let i = from
      for (let k = 0; k < n; k++) {
        i = (i + dir + n) % n
        if (!items[i].disabled) return i
      }
      return from
    },
    [items]
  )

  const edge = useCallback(
    (dir: 1 | -1) => step(dir === 1 ? -1 : items.length, dir),
    [step, items.length]
  )

  const openMenu = useCallback(
    (index?: number) => {
      if (disabled) return
      const usable = selectedIndex >= 0 && !items[selectedIndex].disabled
      viaKey.current = true
      setActiveIndex(index ?? (usable ? selectedIndex : edge(1)))
      setOpen(true)
    },
    [disabled, items, selectedIndex, edge]
  )

  const close = useCallback((restoreFocus = true) => {
    buffer.current = ""
    setOpen(false)
    setActiveIndex(-1)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  const select = useCallback(
    (index: number) => {
      const item = items[index]
      if (!item || item.disabled) return
      if (value === undefined) setUncontrolled(item.value)
      emit.current?.(item.value)
      close()
    },
    [items, value, close]
  )

  const typeahead = useCallback(
    (char: string) => {
      if (bufferTimer.current) clearTimeout(bufferTimer.current)
      buffer.current += char.toLowerCase()
      bufferTimer.current = setTimeout(() => {
        buffer.current = ""
      }, typeaheadDelay)

      const q = buffer.current
      const n = items.length
      const from = activeIndex < 0 ? 0 : activeIndex
      const start = q.length > 1 ? from : from + 1
      for (let k = 0; k < n; k++) {
        const i = (start + k) % n
        const it = items[i]
        if (!it.disabled && it.label.toLowerCase().startsWith(q)) {
          viaKey.current = true
          setActiveIndex(i)
          return
        }
      }
    },
    [items, activeIndex, typeaheadDelay]
  )

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    const onWindowBlur = () => close(false)
    document.addEventListener("pointerdown", onDown, true)
    window.addEventListener("blur", onWindowBlur)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("blur", onWindowBlur)
    }
  }, [open, close])

  useEffect(() => {
    if (!open || activeIndex < 0 || !viaKey.current) return
    viaKey.current = false
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [open, activeIndex])

  useEffect(
    () => () => {
      if (bufferTimer.current) clearTimeout(bufferTimer.current)
    },
    []
  )

  const triggerProps = {
    ref: triggerRef,
    type: "button" as const,
    disabled,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-controls": open ? listId : undefined,
    onClick: () => (open ? close() : openMenu()),
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openMenu()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        openMenu(edge(-1))
      }
    },
  }

  const listProps = {
    ref: listRef,
    id: listId,
    role: "listbox" as const,
    tabIndex: -1,
    "aria-activedescendant": activeIndex >= 0 ? itemId(activeIndex) : undefined,
    onKeyDown: (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const dir = e.key === "ArrowDown" ? 1 : -1
        viaKey.current = true
        setActiveIndex((i) => step(i, dir))
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault()
        viaKey.current = true
        setActiveIndex(edge(e.key === "Home" ? 1 : -1))
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        select(activeIndex)
      } else if (e.key === "Escape") {
        e.preventDefault()
        close()
      } else if (e.key === "Tab") {
        e.preventDefault()
        close()
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        typeahead(e.key)
      }
    },
  }

  const getItemProps = useCallback(
    (index: number) => ({
      id: itemId(index),
      role: "option" as const,
      "aria-selected": index === selectedIndex,
      "aria-disabled": items[index]?.disabled ? (true as const) : undefined,
      ref: (el: HTMLLIElement | null) => {
        itemRefs.current[index] = el
      },
      onPointerMove: () => {
        if (items[index]?.disabled) return
        viaKey.current = false
        setActiveIndex(index)
      },
      onClick: () => select(index),
    }),
    [itemId, items, selectedIndex, select]
  )

  return {
    open,
    openMenu,
    close,
    select,
    activeIndex,
    selectedIndex,
    selectedItem: selectedIndex >= 0 ? items[selectedIndex] : null,
    itemId,
    rootRef,
    triggerProps,
    listProps,
    getItemProps,
  }
}
