"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-[#E8A33D] px-5 py-2.5 text-[13px] font-semibold text-[#0C0A09] print:hidden"
    >
      <Printer size={14} /> Print
    </button>
  );
}
