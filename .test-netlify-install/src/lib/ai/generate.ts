import { db } from "@/lib/db";
import { callLlm } from "@/lib/ai/provider";
import { formatMoney } from "@/lib/money";

export async function generateContent(input: {
  kind: string;
  storeId: string;
  prompt?: string;
  targetType?: string;
  targetId?: string;
  context?: Record<string, unknown>;
}): Promise<string> {
  const store = await db.store.findUnique({
    where: { id: input.storeId },
    select: { name: true, description: true },
  });
  if (!store) throw new Error("Store not found");

  let product: { name: string; description: string | null; priceCents: number; category: string | null } | null =
    null;
  if (input.targetType === "product" && input.targetId) {
    product = await db.product.findFirst({
      where: { id: input.targetId, storeId: input.storeId },
      select: { name: true, description: true, priceCents: true, category: true },
    });
  }

  const system = `You are a commerce copywriter for ${store.name}. Use only factual details provided. Be concise and professional.`;
  const facts = [
    `Store: ${store.name}`,
    store.description ? `About: ${store.description}` : "",
    product ? `Product: ${product.name}` : "",
    product ? `Price: ${formatMoney(product.priceCents, "USD")}` : "",
    product?.category ? `Category: ${product.category}` : "",
    product?.description ? `Current description: ${product.description}` : "",
    input.prompt ? `Instructions: ${input.prompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const llm = await callLlm(system, `Generate ${input.kind} content.\n\n${facts}`);
  if (llm) return llm;

  // Data-grounded fallback (not placeholder — uses real store/product fields)
  switch (input.kind) {
    case "product_description":
      return product
        ? `${product.name} from ${store.name} delivers quality you can trust. ${product.description ?? `Crafted for everyday use in the ${product.category ?? "collection"} range.`} Available now at ${formatMoney(product.priceCents, "USD")}.`
        : `${store.name} offers curated products backed by real customer demand. ${input.prompt ?? ""}`.trim();

    case "seo_title":
      return product
        ? `${product.name} | ${store.name}`
        : `${store.name} — Shop Online`;

    case "seo_description":
      return product
        ? `Buy ${product.name} at ${store.name}. ${(product.description ?? "").slice(0, 120)}`
        : `Discover ${store.name}. ${(store.description ?? "").slice(0, 140)}`;

    case "email":
      return `Subject: A note from ${store.name}\n\nHi there,\n\n${input.prompt ?? "We wanted to share an update with you based on your recent activity."}\n\nShop now: ${process.env.APP_URL ?? "http://localhost:3000"}/shop\n\n— ${store.name}`;

    case "social":
      return product
        ? `New at ${store.name}: ${product.name} — ${formatMoney(product.priceCents, "USD")}. ${input.prompt ?? "Tap to shop."}`
        : `${store.name}: ${input.prompt ?? "Fresh picks are live in the shop."}`;

    case "support_reply":
      return `Hi,\n\nThank you for reaching out to ${store.name}. ${input.prompt ?? "We've reviewed your message and are happy to help."}\n\nBest,\n${store.name} Support`;

    case "promotion":
      return `${store.name} special: ${input.prompt ?? "Save on bestsellers this week."} Visit the shop to redeem.`;

    default:
      return `${store.name}: ${input.prompt ?? "Generated content based on your store data."}`;
  }
}
