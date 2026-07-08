"use client";

import { useEffect } from "react";

export function CodeStorefrontScripts({ js }: { js: string }) {
  useEffect(() => {
    if (!js.trim()) return;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(js);
      fn();
    } catch {
      // Seller code errors must not break the storefront
    }
  }, [js]);

  return null;
}
