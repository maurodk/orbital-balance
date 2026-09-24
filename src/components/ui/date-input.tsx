"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateInputProps {
  /** ISO date string (yyyy-MM-dd) or "" */
  value?: string | null;
  /** Called with an ISO date string (yyyy-MM-dd) or "" when cleared */
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

function isoToBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function brToIso(br: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!match) return "";
  const [, d, m, y] = match;
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1) return "";
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }
  return `${y}-${m}-${d}`;
}

function maskBr(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("/");
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, id, name, className, disabled, placeholder = "DD/MM/AAAA" }, ref) => {
    const [text, setText] = React.useState(() => isoToBr(value));
    const nativeRef = React.useRef<HTMLInputElement | null>(null);

    // Sync from external value unless the user is mid-edit on an equivalent value
    React.useEffect(() => {
      setText((current) => (brToIso(current) === (value ?? "") ? current : isoToBr(value)));
    }, [value]);

    const digitCount = text.replace(/\D/g, "").length;
    const isComplete = digitCount === 8;
    const isInvalid = isComplete && brToIso(text) === "";

    const handleText = (raw: string) => {
      const masked = maskBr(raw);
      setText(masked);
      // The ISO value is only ever set from a fully valid, real calendar date —
      // partial or invalid input clears it so the form can never silently hold
      // a value that doesn't match what's on screen.
      onChange(brToIso(masked));
    };

    const handleBlur = () => {
      // An incomplete date left in the field (e.g. abandoned mid-edit) is
      // invalid too: clear the display so it can't be mistaken for a saved date.
      if (text !== "" && !isComplete) setText("");
      onBlur?.();
    };

    const openPicker = () => {
      const el = nativeRef.current;
      if (!el) return;
      if (typeof el.showPicker === "function") el.showPicker();
      else el.focus();
    };

    return (
      <div className="relative">
        <button
          type="button"
          aria-label="Abrir calendário"
          onClick={openPicker}
          disabled={disabled}
          className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-orbital-gold transition-colors duration-100 hover:bg-orbital-gold/10 active:bg-orbital-gold/20 disabled:opacity-50"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <Input
          id={id}
          name={name}
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          aria-invalid={isInvalid}
          onChange={(e) => handleText(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            "pl-10 pr-4",
            isInvalid && "border-destructive focus-visible:ring-destructive",
            className
          )}
        />
        <input
          ref={nativeRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={value ?? ""}
          onChange={(e) => {
            setText(isoToBr(e.target.value));
            onChange(e.target.value);
          }}
          className="pointer-events-none absolute bottom-0 left-10 h-0 w-0 opacity-0 [color-scheme:dark]"
        />
        {isInvalid && (
          <p className="mt-1 text-xs text-destructive">Data inválida. Use o formato DD/MM/AAAA.</p>
        )}
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
