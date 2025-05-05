/* eslint-disable */
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SingleSelectComboboxProps {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  value?: string;
  onChange: (value: string) => void;
  searchable?: boolean;
}

export function SingleSelectCombobox({
  options,
  placeholder = "Select an option",
  emptyMessage = "No results found",
  className,
  value = '',
  onChange,
  searchable = true,
  ...props
}: SingleSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          dir="ltr"
          className={cn(
            "w-full justify-between h-10",
            "inline-flex items-center gap-2 whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          <span className="flex-1 text-right truncate flex items-center justify-end gap-2">
            {selectedOption ? (
              <>
                <span>{selectedOption.label}</span>
                {selectedOption.icon && <selectedOption.icon className="h-4 w-4 opacity-70" />}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="text-right">
          {searchable && <CommandInput placeholder={placeholder} className="h-9 text-right" dir="rtl" />}
          <CommandEmpty className="text-right">{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  onChange(value === option.value ? '' : option.value)
                  setOpen(false)
                }}
                className="flex items-center justify-start gap-2 text-right"
              >
                <Check
                  className={cn(
                    "ml-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.icon && <option.icon className="h-4 w-4 opacity-70" />}
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface MultiSelectComboboxProps {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  value?: string[];
  onChange: (value: string[]) => void;
  searchable?: boolean;
  maxWidth?: string;
}

export function MultiSelectCombobox({
  options,
  placeholder = "Select options",
  emptyMessage = "No results found",
  className,
  value = [],
  onChange,
  searchable = true,
  maxWidth = "100%",
  ...props
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [startX, setStartX] = React.useState(0)
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState<number | null>(null)

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [])

  return (
    <div className="relative w-full" style={{ maxWidth: containerWidth ? `${containerWidth}px` : maxWidth }} ref={containerRef}>
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="absolute -top-6 left-0 text-xs text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-2 py-0.5 rounded-full flex-shrink-0 z-10 transition-colors"
          dir="rtl"
        >
          حذف همه
        </button>
      )}
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10",
              "inline-flex items-center gap-2 whitespace-nowrap rounded-md border bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            {value.length > 0 ? (
              <div className="flex-1 relative overflow-hidden" dir="rtl">
                <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10 bg-gradient-to-r from-background to-transparent"></div>
                <div 
                  ref={scrollContainerRef}
                  className="overflow-x-auto hide-scrollbar flex items-center gap-1 pr-1 cursor-grab active:cursor-grabbing" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch', 
                    maxWidth: '100%', 
                    width: '100%',
                    paddingRight: '8px',
                    paddingLeft: '8px'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                >
                  {value.map((item) => (
                    <div 
                      key={item} 
                      className="flex items-center gap-1 bg-gray-200 dark:bg-zinc-700 px-2 py-0 rounded-md text-xs flex-shrink-0 h-6"
                    >
                      {options.find((option) => option.value === item)?.label || item}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnselect(item);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 h-4 w-4 inline-flex items-center justify-center rounded-full flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10 bg-gradient-to-l from-background to-transparent"></div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-end">
                <span className="text-muted-foreground">{placeholder}</span>
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={containerWidth ? { width: `${containerWidth}px` } : {}} align="start">
          <Command>
            {searchable && <CommandInput placeholder={placeholder} className="h-9" />}
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {options.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onChange(
                        isSelected
                          ? value.filter((i) => i !== option.value)
                          : [...value, option.value]
                      )
                      setOpen(true)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
} 