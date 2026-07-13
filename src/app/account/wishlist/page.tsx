import { WishlistGrid } from "@/components/account/WishlistGrid";

export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
      <p className="mt-1 text-[13.5px] text-ink-dim">
        Products you&apos;ve saved across all Foundry stores.
      </p>
      <WishlistGrid />
    </div>
  );
}
