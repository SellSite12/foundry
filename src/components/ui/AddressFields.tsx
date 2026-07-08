"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { Input } from "@/components/ui/Input";
import type { AddressFieldValue, AddressSuggestion } from "@/lib/address/types";

type Props = {
  value: AddressFieldValue;
  onChange: (value: AddressFieldValue) => void;
  idPrefix?: string;
  line1Label?: string;
  line2Label?: string;
  stateLabel?: string;
  gridClassName?: string;
  variant?: "default" | "plain";
  inputClassName?: string;
  labelClassName?: string;
};

export function AddressFields({
  value,
  onChange,
  idPrefix,
  line1Label = "Address line 1",
  line2Label = "Address line 2",
  stateLabel = "State / Province",
  gridClassName = "grid grid-cols-2 gap-4",
  variant = "default",
  inputClassName,
  labelClassName,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const prefix = idPrefix ?? `addr-${uid}`;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const skipSearchRef = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const applySuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      skipSearchRef.current = true;
      onChange({
        line1: suggestion.line1,
        line2: suggestion.line2,
        city: suggestion.city,
        state: suggestion.state,
        postalCode: suggestion.postalCode,
        country: suggestion.country,
      });
      setSuggestions([]);
      close();
    },
    [close, onChange]
  );

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close]);

  useEffect(() => {
    const query = value.line1.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestRef.current;
      setLoading(true);
      try {
        const res = await fetch(`/api/address/search?q=${encodeURIComponent(query)}`);
        if (!res.ok || requestId !== requestRef.current) return;
        const json = (await res.json()) as { data?: { suggestions?: AddressSuggestion[] } };
        const next = json.data?.suggestions ?? [];
        if (requestId !== requestRef.current) return;
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
      } catch {
        if (requestId === requestRef.current) setSuggestions([]);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value.line1]);

  function patch(field: keyof AddressFieldValue, next: string) {
    onChange({ ...value, [field]: next });
  }

  function onLine1KeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      applySuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  }

  const line1Id = `${prefix}-line1`;
  const listboxId = `${prefix}-suggestions`;

  if (variant === "plain") {
    const input = inputClassName ?? "w-full rounded-lg border border-line bg-base px-3 py-2.5 text-[14px] text-ink outline-none focus:border-copper";
    const label = labelClassName ?? "mb-1.5 block text-[13px] font-medium text-ink";

    return (
      <div className="flex flex-col gap-4">
        <div ref={rootRef} className="relative">
          <label htmlFor={line1Id} className={label}>
            {line1Label}
          </label>
          <input
            id={line1Id}
            className={input}
            value={value.line1}
            onChange={(e) => patch("line1", e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={onLine1KeyDown}
            autoComplete="address-line1"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
          />
          {open && suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li key={s.id} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                      i === activeIndex ? "bg-surface-raised text-ink" : "text-ink-dim hover:bg-surface-raised hover:text-ink"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySuggestion(s)}
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {loading ? <p className="mt-1 text-[12px] text-ink-faint">Searching addresses…</p> : null}
        </div>
        <div>
          <label htmlFor={`${prefix}-line2`} className={label}>
            {line2Label}
          </label>
          <input
            id={`${prefix}-line2`}
            className={input}
            value={value.line2}
            onChange={(e) => patch("line2", e.target.value)}
            autoComplete="address-line2"
          />
        </div>
        <div className={gridClassName}>
          <div>
            <label htmlFor={`${prefix}-city`} className={label}>
              City
            </label>
            <input
              id={`${prefix}-city`}
              className={input}
              value={value.city}
              onChange={(e) => patch("city", e.target.value)}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label htmlFor={`${prefix}-state`} className={label}>
              {stateLabel}
            </label>
            <input
              id={`${prefix}-state`}
              className={input}
              value={value.state}
              onChange={(e) => patch("state", e.target.value)}
              autoComplete="address-level1"
            />
          </div>
          <div>
            <label htmlFor={`${prefix}-postal`} className={label}>
              Postal code
            </label>
            <input
              id={`${prefix}-postal`}
              className={input}
              value={value.postalCode}
              onChange={(e) => patch("postalCode", e.target.value)}
              autoComplete="postal-code"
            />
          </div>
          <div>
            <label htmlFor={`${prefix}-country`} className={label}>
              Country
            </label>
            <input
              id={`${prefix}-country`}
              className={input}
              value={value.country}
              onChange={(e) => patch("country", e.target.value)}
              autoComplete="country-name"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={rootRef} className="relative flex flex-col gap-1.5">
        <label htmlFor={line1Id} className="text-[12.5px] font-medium text-ink-dim">
          {line1Label}
        </label>
        <input
          id={line1Id}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink placeholder-ink-faint outline-none transition-colors focus:border-line-strong"
          value={value.line1}
          onChange={(e) => patch("line1", e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onLine1KeyDown}
          placeholder="Start typing your address"
          autoComplete="address-line1"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
        {open && suggestions.length > 0 ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            {suggestions.map((s, i) => (
              <li key={s.id} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                    i === activeIndex ? "bg-surface-raised text-ink" : "text-ink-dim hover:bg-surface-raised hover:text-ink"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" />
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {loading ? <p className="text-[12px] text-ink-faint">Searching addresses…</p> : null}
      </div>
      <Input
        label={line2Label}
        id={`${prefix}-line2`}
        value={value.line2}
        onChange={(e) => patch("line2", e.target.value)}
        autoComplete="address-line2"
      />
      <div className={gridClassName}>
        <Input
          label="City"
          id={`${prefix}-city`}
          value={value.city}
          onChange={(e) => patch("city", e.target.value)}
          autoComplete="address-level2"
        />
        <Input
          label={stateLabel}
          id={`${prefix}-state`}
          value={value.state}
          onChange={(e) => patch("state", e.target.value)}
          autoComplete="address-level1"
        />
        <Input
          label="Postal code"
          id={`${prefix}-postal`}
          value={value.postalCode}
          onChange={(e) => patch("postalCode", e.target.value)}
          autoComplete="postal-code"
        />
        <Input
          label="Country"
          id={`${prefix}-country`}
          value={value.country}
          onChange={(e) => patch("country", e.target.value)}
          autoComplete="country-name"
        />
      </div>
    </div>
  );
}
