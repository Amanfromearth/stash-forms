"use client"

// Interior's dropdown behavior and spring menu, with searchable survey options.
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent, ReactNode } from "react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { InteriorValidationContext } from "./validation-context"
import { useDropdown } from "./use-dropdown"
import { INSTANT, PRESS } from "./motion"

export function InteriorSelect({
  id,
  label,
  options,
  value,
  onChange,
  required,
  renderOptionIcon,
}: {
  id: string
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
  required?: boolean
  renderOptionIcon?: (option: string) => ReactNode
}) {
  const reduced = useReducedMotion()
  const validationError = useContext(InteriorValidationContext)
  const [query, setQuery] = useState("")
  const items = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return options
      .filter((option) => option.toLocaleLowerCase().includes(search))
      .sort(
        (a, b) =>
          Number(!a.toLocaleLowerCase().startsWith(search)) -
          Number(!b.toLocaleLowerCase().startsWith(search))
      )
      .map((option) => ({ value: option, label: option }))
  }, [options, query])
  const {
    open,
    openMenu,
    activeIndex,
    itemId,
    rootRef,
    triggerProps,
    listProps,
    getItemProps,
  } = useDropdown({
    items,
    value,
    onChange: (next) => {
      onChange(next)
      setQuery("")
    },
  })
  return (
    <div
      ref={rootRef}
      data-survey-control
      className="relative w-full"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        {...triggerProps}
        onClick={() => {
          if (!open) setQuery("")
          triggerProps.onClick()
        }}
        onKeyDown={(event) => {
          if (
            !open &&
            ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)
          )
            setQuery("")
          triggerProps.onKeyDown(event)
        }}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listProps.id}
        aria-label={label}
        aria-required={required || undefined}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? "survey-field-error" : undefined}
        aria-autocomplete="none"
        className={cn(
          "flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-5 py-4 text-left text-base text-foreground shadow-[inset_0_1px_0_#ffffff08,0_2px_4px_#0000000a] transition-[border-color,box-shadow] outline-none hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30",
          validationError
            ? "border-destructive"
            : open
              ? "border-primary ring-2 ring-ring/20"
              : "border-border"
        )}
      >
        {value && renderOptionIcon?.(value)}
        <span
          className={cn("min-w-0 flex-1", !value && "text-muted-foreground")}
        >
          {value || "Select your country"}
        </span>
        <m.svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-4 shrink-0 text-muted-foreground"
          initial={false}
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduced ? INSTANT : PRESS}
        >
          <path
            d="m4 6 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </m.svg>
      </button>
      <AnimatePresence>
        {open && (
          <SelectMenu
            label={label}
            items={items}
            value={value}
            query={query}
            setQuery={setQuery}
            openMenu={openMenu}
            listProps={listProps}
            getItemProps={getItemProps}
            itemId={itemId}
            activeIndex={activeIndex}
            renderOptionIcon={renderOptionIcon}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

type DropdownBindings = ReturnType<typeof useDropdown>
interface SelectMenuProps {
  label: string
  items: { value: string; label: string }[]
  value: string
  query: string
  setQuery: (query: string) => void
  openMenu: DropdownBindings["openMenu"]
  listProps: DropdownBindings["listProps"]
  getItemProps: DropdownBindings["getItemProps"]
  itemId: DropdownBindings["itemId"]
  activeIndex: number
  renderOptionIcon?: (option: string) => ReactNode
}

function SelectMenu({
  label,
  items,
  value,
  query,
  setQuery,
  openMenu,
  listProps,
  getItemProps,
  itemId,
  activeIndex,
  renderOptionIcon,
}: SelectMenuProps) {
  const reduced = useReducedMotion()
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      searchRef.current?.focus({ preventScroll: true })
    )
    return () => cancelAnimationFrame(frame)
  }, [])
  const navigate = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "Home",
        "End",
        "Enter",
        "Escape",
        "Tab",
      ].includes(event.key)
    ) {
      if (
        (event.key === "Home" || event.key === "End") &&
        event.currentTarget.selectionStart !== null
      )
        return
      listProps.onKeyDown(event as unknown as KeyboardEvent<HTMLUListElement>)
    }
  }

  return (
    <m.div
      initial={{
        opacity: 0,
        y: reduced ? 0 : -6,
        scale: reduced ? 1 : 0.98,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: reduced ? 0 : -4,
        transition: reduced ? INSTANT : { duration: 0.1 },
      }}
      transition={reduced ? INSTANT : PRESS}
      className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_40px_#00000030]"
      style={{ transformOrigin: "top center" }}
    >
      <div className="mb-1 flex items-center gap-2 border-b border-border px-3 pt-1 pb-2">
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle
            cx="7"
            cy="7"
            r="4.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="m10.5 10.5 3 3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={searchRef}
          tabIndex={0}
          type="search"
          aria-label="Search countries"
          aria-controls={listProps.id}
          aria-activedescendant={
            items[activeIndex] ? itemId(activeIndex) : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            openMenu(0)
          }}
          onKeyDown={navigate}
          placeholder="Search countries"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul
        {...listProps}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={
          items[activeIndex] ? itemId(activeIndex) : undefined
        }
        className="max-h-[min(240px,40dvh)] overflow-y-auto overscroll-contain outline-none"
      >
        {items.map((item, index) => (
          <li
            key={item.value}
            {...getItemProps(index)}
            className={cn(
              "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground select-none",
              index === activeIndex && "bg-muted",
              item.value === value && "text-primary"
            )}
          >
            {renderOptionIcon?.(item.value)}
            <span className="min-w-0 flex-1">{item.label}</span>
            {item.value === value && (
              <m.svg
                aria-hidden="true"
                className="size-4 shrink-0"
                viewBox="0 0 14 14"
                fill="none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduced ? INSTANT : PRESS}
              >
                <path
                  d="m2.5 7 3 3 6-6.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </m.svg>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li
            role="presentation"
            className="px-3 py-4 text-sm text-muted-foreground"
          >
            No countries found. Try another search.
          </li>
        )}
      </ul>
      <p aria-live="polite" className="sr-only">
        {items.length} countries available
      </p>
    </m.div>
  )
}
