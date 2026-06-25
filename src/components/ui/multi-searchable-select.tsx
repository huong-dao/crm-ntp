"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

type MultiSearchableSelectProps = {
  id?: string;
  name: string;
  options: SearchableSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function MultiSearchableSelect({
  id: idProp,
  name,
  options,
  values,
  onChange,
  placeholder = "Chọn thêm nhân sự...",
  searchPlaceholder = "Tìm theo tên hoặc mã...",
  disabled = false,
  emptyMessage = "Không có kết quả",
  className,
}: MultiSearchableSelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOptions = options.filter((option) => values.includes(option.value));

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((option) => {
      if (values.includes(option.value)) return false;
      if (!q) return true;
      const haystack = (option.searchText ?? option.label).toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query, values]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addValue(nextValue: string) {
    if (!values.includes(nextValue)) {
      onChange([...values, nextValue]);
    }
    setQuery("");
    setOpen(false);
  }

  function removeValue(nextValue: string) {
    onChange(values.filter((value) => value !== nextValue));
  }

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      {values.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full bg-[#1e3a5f]/10 px-3 py-1 text-sm text-[#1e3a5f]"
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-[#1e3a5f]/20"
                  onClick={() => removeValue(option.value)}
                  aria-label={`Bỏ ${option.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          className={cn(
            "flex min-h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="text-gray-500">{placeholder}</span>
          <span className="ml-2 text-gray-400">▾</span>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
                autoFocus
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {available.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</li>
              ) : (
                available.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => addValue(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
