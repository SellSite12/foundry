"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";

const DEVICE_WIDTHS = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;
type Device = keyof typeof DEVICE_WIDTHS;

export function TemplatePreviewFrame({
  children,
  badge,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2">
        <div className="flex items-center gap-2">
          {badge}
          <div className="flex items-center gap-1 rounded-lg border border-line bg-base p-0.5">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                className={`rounded-md p-1.5 transition-colors ${
                  device === key ? "bg-copper-soft text-copper" : "text-ink-dim hover:text-ink"
                }`}
                aria-label={key}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
        <span className="text-[11px] text-ink-faint">Preview — not live until you apply</span>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-base2 p-3">
        <div
          className="h-full min-h-[520px] overflow-hidden rounded-xl border border-line bg-white shadow-lg transition-all duration-300"
          style={{ width: DEVICE_WIDTHS[device], maxWidth: "100%" }}
        >
          <div className="h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
